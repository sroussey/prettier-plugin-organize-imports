import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

/** A zero-based line/character pair; `character` counts UTF-16 code units. */
export interface LspPosition {
	readonly line: number;
	readonly character: number;
}

export interface LspRange {
	readonly start: LspPosition;
	readonly end: LspPosition;
}

export interface LspTextEdit {
	readonly range: LspRange;
	readonly newText: string;
}

interface LspMessage {
	readonly id?: number | string;
	readonly method?: string;
	readonly params?: unknown;
	readonly result?: unknown;
	readonly error?: { readonly code: number; readonly message: string };
}

export interface LspConnection {
	request(method: string, params: unknown): Promise<unknown>;
	notify(method: string, params: unknown): void;
	dispose(): void;
}

/**
 * How long to wait for a single response before giving up. The first request against a large
 * project pays for the whole program load, so this is generous; it exists only so that a wedged
 * server surfaces as an unorganized file rather than a Prettier run that never returns.
 */
const REQUEST_TIMEOUT_MS = 30_000;

const HEADER_SEPARATOR = '\r\n\r\n';

/**
 * Speak LSP's JSON-RPC framing to a child process over stdio.
 *
 * The connection keeps itself unreferenced while idle, so a finished Prettier run exits instead of
 * waiting on a server nobody is talking to any more, and references itself again for as long as a
 * request is in flight, so the run does not exit out from under a pending response.
 */
export const createLspConnection = (
	exe: string,
	args: readonly string[],
	handleServerRequest: (method: string, params: unknown) => unknown,
): LspConnection => {
	const child = spawn(exe, [...args], {
		stdio: ['pipe', 'pipe', process.env.DEBUG ? 'inherit' : 'ignore'],
	});

	const pending = new Map<number, { resolve: (result: unknown) => void; reject: (error: Error) => void }>();

	let nextId = 1;
	let buffer = Buffer.alloc(0);
	let disposed = false;

	const setReferenced = (referenced: boolean): void => {
		for (const handle of [child, child.stdin, child.stdout] as ReadonlyArray<
			ChildProcess | NodeJS.WritableStream | NodeJS.ReadableStream | null
		>) {
			// `ref`/`unref` are present on the child and on its stdio sockets, but not in the types
			// shared by both, and a stream can already be destroyed by the time we get here.
			const target = handle as { ref?: () => void; unref?: () => void } | null;

			if (referenced) {
				target?.ref?.();
			} else {
				target?.unref?.();
			}
		}
	};

	const send = (message: unknown): void => {
		const body = JSON.stringify(message);

		child.stdin.write(`Content-Length: ${Buffer.byteLength(body, 'utf8')}${HEADER_SEPARATOR}${body}`);
	};

	const settle = (id: number, settler: (entry: NonNullable<ReturnType<typeof pending.get>>) => void): void => {
		const entry = pending.get(id);

		if (!entry) {
			return;
		}

		pending.delete(id);

		if (pending.size === 0) {
			setReferenced(false);
		}

		settler(entry);
	};

	const rejectAll = (error: Error): void => {
		for (const id of [...pending.keys()]) {
			settle(id, (entry) => entry.reject(error));
		}
	};

	const receive = (message: LspMessage): void => {
		if (typeof message.id === 'number' && message.method === undefined) {
			settle(message.id, (entry) =>
				message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result),
			);

			return;
		}

		if (message.id !== undefined && message.method !== undefined) {
			// A server-to-client request. Every one of them has to be answered: the server treats an
			// unanswered request as a cancelled context and stops serving the requests we care about.
			send({ jsonrpc: '2.0', id: message.id, result: handleServerRequest(message.method, message.params) });
		}
	};

	child.stdout.on('data', (chunk: Buffer) => {
		buffer = Buffer.concat([buffer, chunk]);

		for (;;) {
			const separator = buffer.indexOf(HEADER_SEPARATOR);

			if (separator < 0) {
				return;
			}

			const contentLength = /content-length: *(\d+)/i.exec(buffer.subarray(0, separator).toString('ascii'));

			if (!contentLength?.[1]) {
				rejectAll(new Error('Malformed LSP header from the TypeScript server.'));
				return;
			}

			const bodyStart = separator + HEADER_SEPARATOR.length;
			const bodyEnd = bodyStart + Number(contentLength[1]);

			if (buffer.length < bodyEnd) {
				return;
			}

			const body = buffer.subarray(bodyStart, bodyEnd).toString('utf8');

			buffer = buffer.subarray(bodyEnd);

			receive(JSON.parse(body) as LspMessage);
		}
	});

	const fail = (reason: string) => (): void => {
		if (!disposed) {
			rejectAll(new Error(reason));
		}
	};

	child.on('error', fail('The TypeScript language server could not be started.'));
	child.on('exit', fail('The TypeScript language server exited unexpectedly.'));

	setReferenced(false);

	return {
		request: (method, params) =>
			new Promise((resolve, reject) => {
				const id = nextId++;

				if (pending.size === 0) {
					setReferenced(true);
				}

				const timeout = setTimeout(() => {
					settle(id, (entry) => entry.reject(new Error(`The TypeScript language server did not answer ${method}.`)));
				}, REQUEST_TIMEOUT_MS);

				timeout.unref();

				pending.set(id, {
					resolve: (result) => {
						clearTimeout(timeout);
						resolve(result);
					},
					reject: (error) => {
						clearTimeout(timeout);
						reject(error);
					},
				});

				send({ jsonrpc: '2.0', id, method, params });
			}),
		notify: (method, params) => send({ jsonrpc: '2.0', method, params }),
		dispose: () => {
			disposed = true;
			rejectAll(new Error('The TypeScript language server was shut down.'));
			child.kill();
		},
	};
};
