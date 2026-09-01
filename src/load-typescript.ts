import type * as TypeScript from '@typescript/typescript6';
import { nodeRequire } from './node-require.js';

export type TypeScriptModule = typeof TypeScript;

let cached: TypeScriptModule | undefined;

/**
 * The TypeScript language service API, from this package's own `@typescript/typescript6`
 * dependency rather than from whatever `typescript` the project happens to have installed.
 * TypeScript 7.0 dropped the programmatic language service API this plugin is built on, so
 * following the project's version is no longer possible.
 *
 * @see https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0
 *
 * Loaded on first use rather than at module scope: Prettier loads this plugin for every file it
 * formats, and pulling in the whole compiler to format a stylesheet is pure cost.
 */
export function getTypeScript(): TypeScriptModule {
	return (cached ??= nodeRequire('@typescript/typescript6') as TypeScriptModule);
}
