import type { TextChange } from '@typescript/typescript6';

/**
 * Apply the given set of text changes to the input.
 */
export const applyTextChanges = (input: string, changes: readonly TextChange[]): string =>
	changes.reduceRight((text, change) => {
		const head = text.slice(0, change.span.start);
		const tail = text.slice(change.span.start + change.span.length);

		return `${head}${change.newText}${tail}`;
	}, input);
