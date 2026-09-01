import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { nodeRequire } from './node-require.js';

/**
 * Absolute path to the native `tsc` executable belonging to the project's own `typescript`.
 *
 * The executable ships in a platform-specific package (`@typescript/typescript-linux-x64` and
 * friends), and `typescript`'s own `getExePath` is what knows how to find it — including the
 * `.exe` suffix and long-path prefix on Windows, and the two layouts it takes inside the
 * TypeScript repo itself. That module sits outside the package's `exports` map, so it is reached
 * through the resolved location of `package.json` rather than as a subpath import.
 */
export const getTypeScriptExePath = async (): Promise<string> => {
	const packageJson = nodeRequire.resolve('typescript/package.json');
	const getExePath = (await import(pathToFileURL(join(dirname(packageJson), 'lib', 'getExePath.js')).href)) as {
		readonly default: () => string;
	};

	return getExePath.default();
};
