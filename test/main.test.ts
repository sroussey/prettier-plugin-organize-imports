import { describe, expect, test } from 'bun:test';
import type { Options } from 'prettier';
import { firstLine, nthLine, prettify } from './utils.js';

interface Expectation {
	readonly options?: Options;
	readonly transformer?: (result: string) => string;
}

const parsers = ['typescript', 'babel', 'babel-ts'] as const;

for (const parser of parsers) {
	describe(`[${parser}]`, () => {
		const organizes = async (
			input: string,
			expected: string,
			{ options = {}, transformer = firstLine }: Expectation = {},
		): Promise<void> => {
			const formattedCode = await prettify(input, { parser, ...options });

			expect(transformer(formattedCode)).toBe(expected);
		};

		test('sorts imports', async () => {
			await organizes(
				`
					import { foo, bar } from "foobar"

					export const foobar = foo + bar
				`,
				'import { bar, foo } from "foobar";',
			);
		});

		test('removes partially unused imports', async () => {
			await organizes(
				`
					import { foo, bar, baz } from "foobar";

					const foobar = foo + baz
				`,
				'import { baz, foo } from "foobar";',
			);
		});

		test('removes completely unused imports', async () => {
			await organizes('import { foo } from "foobar"', '');
		});

		test('works with multi-line imports', async () => {
			await organizes(
				`
					import {
						foo,
						bar,
						baz,
					} from "foobar";

					console.log({ foo, bar, baz });
				`,
				'import { bar, baz, foo } from "foobar";',
			);
		});

		test('works without a filepath', async () => {
			await organizes(
				`
					import { foo, bar } from "foobar"

					export const foobar = foo + bar
				`,
				'import { bar, foo } from "foobar";',
				{ options: { filepath: undefined } },
			);
		});

		test('files with `// organize-imports-ignore` are skipped', async () => {
			await organizes(
				`
					// organize-imports-ignore
					import { foo, bar } from "foobar"

					export const foobar = foo + bar
				`,
				'import { foo, bar } from "foobar";',
				{ transformer: nthLine(1) },
			);
		});
	});
}

test('skips when formatting a range', async () => {
	const code = 'import { foo } from "./bar";';

	const formattedCode1 = await prettify(code, { rangeEnd: 10 });
	const formattedCode2 = await prettify(code, { rangeStart: 10 });

	expect(formattedCode1).toBe(code);
	expect(formattedCode2).toBe(code);
});

test('does not remove unused imports with `organizeImportsSkipDestructiveCodeActions` enabled', async () => {
	const code = `import { foo } from "./bar";\n`;

	const formattedCode = await prettify(code, { organizeImportsSkipDestructiveCodeActions: true });

	expect(formattedCode).toBe(code);
});

test('sorts type imports according to the `organizeImportsTypeOrder` option', async () => {
	const code = `import { foo, type baz, bar } from "./foobarbaz";\n\nexport const foobar: baz = foo + bar;\n`;

	const formattedCode1 = await prettify(code, { parser: 'typescript', organizeImportsTypeOrder: 'last' });
	const formattedCode2 = await prettify(code, { parser: 'typescript', organizeImportsTypeOrder: 'first' });
	const formattedCode3 = await prettify(code, { parser: 'typescript', organizeImportsTypeOrder: 'inline' });

	expect(formattedCode1).toBe(
		`import { bar, foo, type baz } from "./foobarbaz";\n\nexport const foobar: baz = foo + bar;\n`,
	);
	expect(formattedCode2).toBe(
		`import { type baz, bar, foo } from "./foobarbaz";\n\nexport const foobar: baz = foo + bar;\n`,
	);
	expect(formattedCode3).toBe(
		`import { bar, type baz, foo } from "./foobarbaz";\n\nexport const foobar: baz = foo + bar;\n`,
	);
});
