import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { memoize } from './memoize.js';

/**
 * Find the path of the project's tsconfig from a path to a file in the project.
 */
export const findTsconfig: (path: string) => string | undefined = memoize((path: string) => {
	let directory = dirname(resolve(path));

	for (;;) {
		const tsconfig = join(directory, 'tsconfig.json');

		if (existsSync(tsconfig)) {
			return tsconfig;
		}

		const parent = dirname(directory);

		if (parent === directory) {
			return undefined;
		}

		directory = parent;
	}
});
