import { dirname } from 'node:path';
import type { LanguageService, LanguageServiceHost } from '@typescript/typescript6';
import type { ParserOptions } from 'prettier';
import { findTsconfig } from './find-tsconfig.js';
import { getTypeScriptLanguageServiceHost } from './service-host.js';
import { getTypeScript } from './load-typescript.js';
import { nodeRequire } from './node-require.js';

/**
 * Get the correct language service for the given parser.
 */
export const getLanguageService = (
	parser: ParserOptions['parser'],
	filepath: string,
	code: string,
): LanguageService => {
	const ts = getTypeScript();

	const langaugeServiceHost = getTypeScriptLanguageServiceHost(filepath, code);

	const languageService = ts.createLanguageService(langaugeServiceHost);

	switch (parser) {
		case 'vue':
			return getVueDecoratedProxyLanguageService(langaugeServiceHost, languageService, filepath);

		/** @todo add svelte support */

		default:
			return languageService;
	}
};

/**
 * Decorate a language service so it can handle Vue files.
 */
function getVueDecoratedProxyLanguageService(
	langaugeServiceHost: LanguageServiceHost,
	languageService: LanguageService,
	filepath: string,
): LanguageService {
	const ts = getTypeScript();

	const vueTscDir = tryCatch(() => dirname(nodeRequire.resolve('vue-tsc/package.json')));

	if (!vueTscDir) {
		console.error('Please install vue-tsc to organize imports in Vue files.');
		return languageService;
	}

	const { createProxyLanguageService, decorateLanguageServiceHost } = nodeRequire(
		nodeRequire.resolve('@volar/typescript', { paths: [vueTscDir] }),
	) as typeof import('@volar/typescript');

	const { createLanguage, createVueLanguagePlugin, FileMap, createParsedCommandLine, getDefaultCompilerOptions } =
		nodeRequire(
			nodeRequire.resolve('@vue/language-core', { paths: [vueTscDir] }),
		) as typeof import('@vue/language-core');

	const tsconfig = findTsconfig(filepath);

	/**
	 * Volar's signatures say `typeof import('typescript')`, which resolves to this repo's
	 * `typescript` devDependency. We hand it our own TypeScript 6, which is the API it needs at
	 * runtime; the two type as incompatible only over the `versionMajorMinor` literal.
	 */
	const volarTs = ts as unknown as typeof import('typescript');

	const vueLanguagePlugin = createVueLanguagePlugin(
		volarTs,
		langaugeServiceHost.getCompilationSettings(),
		tsconfig ? createParsedCommandLine(volarTs, ts.sys, tsconfig).vueOptions : getDefaultCompilerOptions(),
		(s: string) => s,
	);

	const language = createLanguage([vueLanguagePlugin], new FileMap(ts.sys.useCaseSensitiveFileNames), () => {});

	const snapshot = langaugeServiceHost.getScriptSnapshot(filepath);

	if (snapshot) {
		language.scripts.set(filepath, snapshot);
	}

	const { initialize, proxy } = createProxyLanguageService(languageService);

	initialize(language);

	// Same mismatch as `volarTs` above, for the host type.
	decorateLanguageServiceHost(
		volarTs,
		language,
		langaugeServiceHost as unknown as Parameters<typeof decorateLanguageServiceHost>[2],
	);

	return proxy;
}

function tryCatch<T>(fn: () => T): T | undefined {
	try {
		return fn();
	} catch {
		return undefined;
	}
}
