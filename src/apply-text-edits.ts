import type { LspPosition, LspTextEdit } from './lsp-connection.js';

/** Offset of the first character of each line, so that LSP positions can be resolved. */
const getLineStarts = (text: string): readonly number[] => {
	const starts = [0];

	for (let index = text.indexOf('\n'); index >= 0; index = text.indexOf('\n', index + 1)) {
		starts.push(index + 1);
	}

	return starts;
};

/**
 * LSP counts a position's `character` in UTF-16 code units, which is what a JavaScript string is
 * indexed in, so no re-encoding is needed — only clamping, since a position may sit past the end of
 * its line or past the end of the document.
 */
const getOffset = (text: string, lineStarts: readonly number[], position: LspPosition): number => {
	const lineStart = lineStarts[position.line];

	if (lineStart === undefined) {
		return text.length;
	}

	return Math.min(lineStart + position.character, lineStarts[position.line + 1] ?? text.length);
};

/**
 * Apply the given set of text edits to the input.
 *
 * Edits from a single code action never overlap, so applying them back to front lets each one use
 * offsets computed against the original text.
 */
export const applyTextEdits = (input: string, edits: readonly LspTextEdit[]): string => {
	const lineStarts = getLineStarts(input);

	return edits
		.map((edit) => ({
			start: getOffset(input, lineStarts, edit.range.start),
			end: getOffset(input, lineStarts, edit.range.end),
			newText: edit.newText,
		}))
		.sort((left, right) => right.start - left.start)
		.reduce((text, edit) => `${text.slice(0, edit.start)}${edit.newText}${text.slice(edit.end)}`, input);
};
