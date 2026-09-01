import { dirname } from 'node:path';
import type { LanguageServiceHost } from '@typescript/typescript6';
import { findTsconfig } from './find-tsconfig.js';
import { getCompilerOptions } from './get-compiler-options.js';
import { getTypeScript } from './load-typescript.js';

/**
 * Create the most basic TS language service host for the given file to make import sorting work.
 *
 * @param path path to file
 * @param content file's content
 */
export function getTypeScriptLanguageServiceHost(path: string, content: string): LanguageServiceHost {
	const ts = getTypeScript();
	const tsconfig = findTsconfig(path);
	const compilerOptions = getCompilerOptions(tsconfig);
	const snapshot = ts.ScriptSnapshot.fromString(content);

	return {
		directoryExists: ts.sys.directoryExists,
		fileExists: ts.sys.fileExists,
		getDefaultLibFileName: ts.getDefaultLibFileName,
		getDirectories: ts.sys.getDirectories,
		readDirectory: ts.sys.readDirectory,
		readFile: ts.sys.readFile,
		getCurrentDirectory: () => (tsconfig ? dirname(tsconfig) : ts.sys.getCurrentDirectory()),
		getCompilationSettings: () => compilerOptions,
		getNewLine: () => ts.sys.newLine,
		getScriptFileNames: () => [path],
		getScriptVersion: () => '0',
		getScriptSnapshot: (filePath) => (filePath === path ? snapshot : undefined),
	};
}
