import { createRequire } from 'node:module';

/**
 * This package is ESM, but it has to resolve the consuming project's own `typescript` from disk, and
 * `import.meta.resolve` is not available on every Node version this plugin supports. So we need a
 * CommonJS `require` for that lookup.
 */
export const nodeRequire: NodeJS.Require = createRequire(import.meta.url);
