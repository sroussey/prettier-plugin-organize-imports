import { expect, test } from 'bun:test';
import { getTypeScript } from '../src/load-typescript.js';

test('resolves the TypeScript language service API', () => {
	const ts = getTypeScript();

	expect(typeof ts.createLanguageService).toBe('function');
	expect(typeof ts.getDefaultCompilerOptions).toBe('function');
	expect(typeof ts.ScriptSnapshot.fromString).toBe('function');
});

test("does not follow the project's own `typescript`, which may have no language service", () => {
	// TypeScript 7 dropped this API; the plugin ships its own TypeScript 6 so it works regardless.
	expect(getTypeScript().versionMajorMinor).toBe('6.0');
});

test('memoizes the resolved module', () => {
	expect(getTypeScript()).toBe(getTypeScript());
});
