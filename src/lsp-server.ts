import { pathToFileURL } from 'node:url';
import type { LspConnection, LspTextEdit } from './lsp-connection.js';
import { createLspConnection } from './lsp-connection.js';
import { getTypeScriptExePath } from './typescript-exe.js';

/** Sort and combine imports, and remove the unused ones. */
const ORGANIZE_IMPORTS_KIND = 'source.organizeImports';

/** Sort and combine imports, leaving unused ones alone. */
const SORT_IMPORTS_KIND = 'source.sortImports';

/**
 * Pick the server's own spelling of a code action kind out of the ones it advertises.
 *
 * The spelling is not stable across TypeScript versions — 7.0 serves `source.organizeImports` and
 * the 7.1 nightlies serve `source.organizeImports.ts` — and a kind the server does not recognise
 * comes back as an empty list of actions rather than an error, which would leave every file
 * silently unsorted. Asking the server which spelling it uses turns that into a version this
 * plugin either works against or refuses outright.
 */
const resolveCodeActionKind = (advertised: readonly string[], kind: string): string | undefined =>
	advertised.find((candidate) => candidate === kind || candidate.startsWith(`${kind}.`));

/**
 * The import preferences a server is started with.
 *
 * The server pulls its configuration exactly once, while handling `initialize`, and ignores later
 * `workspace/didChangeConfiguration` notifications — which is why {@link getLspServer} keys its
 * pool on these values rather than pushing them at a server that is already running.
 */
export interface LspSettings {
	readonly organizeImportsTypeOrder: 'first' | 'last' | 'inline' | undefined;
}

interface CodeAction {
	readonly kind?: string;
	readonly edit?: {
		readonly changes?: Readonly<Record<string, readonly LspTextEdit[]>>;
		readonly documentChanges?: ReadonlyArray<{ readonly edits?: readonly LspTextEdit[] }>;
	};
}

interface LspServer {
	organize(
		filepath: string,
		languageId: string,
		code: string,
		skipDestructiveCodeActions: boolean,
	): Promise<readonly LspTextEdit[]>;
}

const servers = new Map<string, Promise<LspServer>>();

/**
 * Every connection started in this process, so that they can be shut down on the way out.
 *
 * Connections are tracked here rather than through their (asynchronously resolved) server, because
 * `exit` runs no further asynchronous work: anything reached through a promise would never be
 * awaited. Servers do also exit on their own when their stdin closes with the process, so this is
 * the belt to that pair of braces.
 */
const connections = new Set<LspConnection>();

process.on('exit', () => {
	for (const connection of connections) {
		connection.dispose();
	}
});

const startServer = async (root: string, settings: LspSettings): Promise<LspServer> => {
	const rootUri = pathToFileURL(root).href;

	const sections: Readonly<Record<string, unknown>> = {
		// The server reads its import preferences from a flat `js/ts` bag, not from the nested
		// `typescript.preferences.*` shape the VS Code settings UI presents.
		'js/ts': settings.organizeImportsTypeOrder ? { organizeImportsTypeOrder: settings.organizeImportsTypeOrder } : {},
	};

	const exe = await getTypeScriptExePath();

	const connection = createLspConnection(exe, ['--lsp', '--stdio'], (method, params) =>
		method === 'workspace/configuration'
			? (params as { readonly items: ReadonlyArray<{ readonly section?: string }> }).items.map(
					(item) => (item.section === undefined ? undefined : sections[item.section]) ?? {},
				)
			: null,
	);

	connections.add(connection);

	const initialized = (await connection.request('initialize', {
		processId: process.pid,
		rootUri,
		workspaceFolders: [{ uri: rootUri, name: 'prettier-plugin-organize-imports' }],
		capabilities: {
			workspace: { configuration: true },
			textDocument: {
				codeAction: {
					codeActionLiteralSupport: { codeActionKind: { valueSet: [ORGANIZE_IMPORTS_KIND, SORT_IMPORTS_KIND] } },
				},
			},
		},
	})) as { readonly capabilities?: { readonly codeActionProvider?: { readonly codeActionKinds?: readonly string[] } } };

	connection.notify('initialized', {});

	const advertised = initialized.capabilities?.codeActionProvider?.codeActionKinds ?? [];

	const organizeKind = resolveCodeActionKind(advertised, ORGANIZE_IMPORTS_KIND);
	const sortKind = resolveCodeActionKind(advertised, SORT_IMPORTS_KIND);

	if (!organizeKind || !sortKind) {
		connections.delete(connection);
		connection.dispose();

		throw new Error(
			`This TypeScript does not serve organize-imports code actions; it offers ${advertised.join(', ') || 'none'}.`,
		);
	}

	// One document at a time per server: the protocol is a single stream, and interleaving the
	// open/request/close of two files on it would leave whichever finishes second reading the
	// other's document state.
	let queue: Promise<unknown> = Promise.resolve();

	return {
		organize: (filepath, languageId, code, skipDestructiveCodeActions) => {
			const run = queue.then(async () => {
				const kind = skipDestructiveCodeActions ? sortKind : organizeKind;
				const uri = pathToFileURL(filepath).href;

				connection.notify('textDocument/didOpen', {
					textDocument: { uri, languageId, version: 1, text: code },
				});

				try {
					const actions = (await connection.request('textDocument/codeAction', {
						textDocument: { uri },
						range: { start: { line: 0, character: 0 }, end: { line: code.split('\n').length, character: 0 } },
						context: { diagnostics: [], only: [kind] },
					})) as readonly CodeAction[] | null;

					const action = actions?.find((candidate) => candidate.kind === kind);

					return action?.edit?.changes?.[uri] ?? action?.edit?.documentChanges?.[0]?.edits ?? [];
				} finally {
					connection.notify('textDocument/didClose', { textDocument: { uri } });
				}
			});

			queue = run.catch(() => {});

			return run;
		},
	};
};

/**
 * Get the language server for the given project root, starting one if this is the first file to
 * need it. Servers are cached for the lifetime of the process, because a Prettier run formats many
 * files and each new server pays for loading the project again.
 */
export const getLspServer = (root: string, settings: LspSettings): Promise<LspServer> => {
	const key = `${root}\0${settings.organizeImportsTypeOrder ?? ''}`;

	let server = servers.get(key);

	if (!server) {
		server = startServer(root, settings);

		// A server that failed to start should not poison every later file in the run.
		server.catch(() => servers.delete(key));

		servers.set(key, server);
	}

	return server;
};
