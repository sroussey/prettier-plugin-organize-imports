import { join } from 'node:path';
import * as prettier from 'prettier';

/** The built plugin, i. e. the artifact that actually gets published. */
export const pluginPath = join(import.meta.dir, '..', 'dist', 'index.js');

export const prettify = async (code: string, options?: prettier.Options): Promise<string> =>
	prettier.format(code, { plugins: [pluginPath], filepath: 'file.ts', ...options });

export const firstLine = (result: string): string => result.split('\n')[0] ?? '';

export const nthLine =
	(n: number) =>
	(result: string): string =>
		result.split('\n')[n] ?? '';
