/**
 * TypeScript 7.0 does not ship a programmatic language service API.
 * Fall back to `@typescript/typescript6` when `createLanguageService` is missing.
 *
 * @see https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0
 */

const CANDIDATES = ['typescript', '@typescript/typescript6'];

/**
 * @param {(id: string) => any} [req]
 * @returns {any}
 */
function loadTypeScript(req = require) {
	for (const id of CANDIDATES) {
		try {
			const ts = req(id);

			if (ts && typeof ts.createLanguageService === 'function') {
				return ts;
			}
		} catch {
			// package not installed
		}
	}

	throw new Error(
		'prettier-plugin-organize-imports requires the TypeScript language service API (createLanguageService). TypeScript 7.0 does not ship this API (expected in 7.1). Install @typescript/typescript6 next to typescript@7, or use typescript@6. See https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0',
	);
}

/** @type {typeof import('typescript')} */
const ts = loadTypeScript();

module.exports = { loadTypeScript, ts };
