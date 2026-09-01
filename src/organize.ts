import { posix, sep } from 'node:path';
import type { ParserOptions } from 'prettier';
import { applyTextChanges } from './apply-text-changes.js';
import { getLanguageService } from './get-language-service.js';

/**
 * Organize the given code's imports.
 */
export const organize = (
	code: string,
	{
		filepath = 'file.ts',
		organizeImportsSkipDestructiveCodeActions,
		parentParser,
		parser,
		organizeImportsTypeOrder,
	}: ParserOptions,
): string => {
	if (parentParser === 'vue') {
		// we already did the preprocessing in the parent parser, so we skip the child parsers
		return code;
	}

	if (sep !== posix.sep) {
		filepath = filepath.split(sep).join(posix.sep);
	}

	const languageService = getLanguageService(parser, filepath, code);

	const fileChanges = languageService.organizeImports(
		{ type: 'file', fileName: filepath, skipDestructiveCodeActions: organizeImportsSkipDestructiveCodeActions },
		{},
		{ organizeImportsTypeOrder },
	)[0];

	return fileChanges ? applyTextChanges(code, fileChanges.textChanges) : code;
};
