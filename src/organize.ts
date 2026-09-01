import { dirname, extname, resolve } from 'node:path';
import type { ParserOptions } from 'prettier';
import { applyTextEdits } from './apply-text-edits.js';
import { findTsconfig } from './find-tsconfig.js';
import type { LspSettings } from './lsp-server.js';
import { getLspServer } from './lsp-server.js';

const languageIds: Readonly<Record<string, string>> = {
	'.cjs': 'javascript',
	'.cts': 'typescript',
	'.js': 'javascript',
	'.jsx': 'javascriptreact',
	'.mjs': 'javascript',
	'.mts': 'typescript',
	'.ts': 'typescript',
	'.tsx': 'typescriptreact',
};

/**
 * Organize the given code's imports.
 */
export const organize = async (
	code: string,
	{ filepath = 'file.ts', organizeImportsSkipDestructiveCodeActions, organizeImportsTypeOrder }: ParserOptions,
): Promise<string> => {
	const path = resolve(filepath);
	const tsconfig = findTsconfig(path);

	const server = await getLspServer(tsconfig ? dirname(tsconfig) : process.cwd(), {
		organizeImportsTypeOrder: organizeImportsTypeOrder as LspSettings['organizeImportsTypeOrder'],
	});

	const edits = await server.organize(
		path,
		languageIds[extname(path)] ?? 'typescript',
		code,
		Boolean(organizeImportsSkipDestructiveCodeActions),
	);

	return applyTextEdits(code, edits);
};
