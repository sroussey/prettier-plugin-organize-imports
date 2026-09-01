import { memoize } from './memoize.js';
import { getTypeScript } from './load-typescript.js';

/**
 * Find the path of the project's tsconfig from a path to a file in the project.
 */
export const findTsconfig: (path: string) => string | undefined = memoize((path: string) => {
	const ts = getTypeScript();

	return ts.findConfigFile(path, ts.sys.fileExists);
});
