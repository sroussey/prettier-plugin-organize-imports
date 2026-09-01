import { expect, test } from 'bun:test';
import type { Plugin } from 'prettier';
import { pluginPath } from './utils.js';

test('exposes exactly the parsers it means to override', async () => {
	const plugin = ((await import(pluginPath)) as { readonly default: Plugin }).default;

	// `vue` is deliberately absent: organizing a `.vue` file needed Volar to decorate an in-process
	// TypeScript language service, and TypeScript 7 has none to decorate. Registering the parser
	// without being able to organize would take it away from a plugin that can.
	expect(Object.keys(plugin.parsers ?? {}).sort()).toEqual(['babel', 'babel-ts', 'typescript']);
});
