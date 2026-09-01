import type { Parser, ParserOptions, Plugin } from 'prettier';
import { parsers as babelParsers } from 'prettier/plugins/babel';
import { parsers as htmlParsers } from 'prettier/plugins/html';
import { parsers as typescriptParsers } from 'prettier/plugins/typescript';
import { organize } from './organize.js';

/**
 * Organize the code's imports using the `organizeImports` feature of the TypeScript language service API.
 */
const organizeImports = (code: string, options: ParserOptions): string => {
	if (code.includes('// organize-imports-ignore') || code.includes('// tslint:disable:ordered-imports')) {
		return code;
	}

	const isRange =
		Boolean(options.originalText) ||
		options.rangeStart !== 0 ||
		(options.rangeEnd !== Infinity && options.rangeEnd !== code.length);

	if (isRange) {
		return code; // processing a range doesn't make sense
	}

	try {
		return organize(code, options);
	} catch (error) {
		if (process.env.DEBUG) {
			console.error(error);
		}

		return code;
	}
};

/**
 * Set `organizeImports` as the given parser's `preprocess` hook, or merge it with the existing one.
 */
const withOrganizeImportsPreprocess = (parser: Parser): Parser => ({
	...parser,
	preprocess: (code: string, options: ParserOptions): string | Promise<string> => {
		const preprocessed = parser.preprocess ? parser.preprocess(code, options) : code;

		// Prettier awaits `preprocess`, but staying synchronous whenever the wrapped parser is
		// keeps this a plain function call for every parser that ships with Prettier today.
		return typeof preprocessed === 'string'
			? organizeImports(preprocessed, options)
			: preprocessed.then((text) => organizeImports(text, options));
	},
});

const plugin: Plugin = {
	options: {
		organizeImportsSkipDestructiveCodeActions: {
			type: 'boolean',
			default: false,
			category: 'OrganizeImports',
			description: 'Skip destructive code actions like removing unused imports.',
		},
		organizeImportsTypeOrder: {
			type: 'choice',
			choices: [
				{
					value: 'last',
					description: 'Places type imports last.',
				},
				{
					value: 'first',
					description: 'Places type imports first.',
				},
				{
					value: 'inline',
					description: 'Keeps type imports in place.',
				},
			],
			category: 'OrganizeImports',
			description: 'How to sort type imports when mixed in an import statement.',
		},
	},
	parsers: {
		babel: withOrganizeImportsPreprocess(babelParsers.babel),
		'babel-ts': withOrganizeImportsPreprocess(babelParsers['babel-ts']),
		typescript: withOrganizeImportsPreprocess(typescriptParsers.typescript),
		vue: withOrganizeImportsPreprocess(htmlParsers.vue),
	},
};

export default plugin;
