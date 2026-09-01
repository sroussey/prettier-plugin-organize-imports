import { dirname } from 'node:path';
import type { CompilerOptions } from '@typescript/typescript6';
import { memoize } from './memoize.js';
import { getTypeScript } from './load-typescript.js';

/**
 * Get the compiler options from the path to a tsconfig.
 *
 * @param tsconfig path to tsconfig
 */
function getCompilerOptionsUncached(tsconfig: string | undefined): CompilerOptions {
	const ts = getTypeScript();

	const compilerOptions = tsconfig
		? ts.parseJsonConfigFileContent(ts.readConfigFile(tsconfig, ts.sys.readFile).config, ts.sys, dirname(tsconfig))
				.options
		: ts.getDefaultCompilerOptions();

	compilerOptions.allowJs = true; // for automatic JS support
	compilerOptions.allowNonTsExtensions = true; // for Vue support

	return compilerOptions;
}

export const getCompilerOptions: (tsconfig: string | undefined) => CompilerOptions =
	memoize(getCompilerOptionsUncached);
