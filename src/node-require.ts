import { createRequire } from 'node:module';

/**
 * This package is ESM, but the TypeScript language service API and Volar's Vue packages have to be
 * resolved and loaded synchronously (Prettier's `preprocess` hook is synchronous), and their exact
 * location depends on the consuming project. So we need a CommonJS `require` for those.
 */
export const nodeRequire: NodeJS.Require = createRequire(import.meta.url);
