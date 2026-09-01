[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/sroussey/prettier-plugin-organize-imports/test.yml?label=CI)](https://github.com/sroussey/prettier-plugin-organize-imports/actions?query=branch%3Amaster)

# Prettier Plugin: Organize Imports

> Make sure that your import statements stay consistent no matter who writes them and what their preferences are.

_This is a fork of [`prettier-plugin-organize-imports`](https://github.com/simonhaenisch/prettier-plugin-organize-imports) published as `@sroussey/prettier-plugin-organize-imports`. It follows the project's own TypeScript through the `typescript/unstable` API introduced in the TypeScript 7.1 nightlies, ships as **ESM only** (so it requires Prettier 3), and is written in TypeScript, built and tested with [Bun](https://bun.sh). The plugin's behaviour and options are otherwise unchanged._

A plugin that makes Prettier organize your imports (i. e. sorts, combines and removes unused ones) using the `organizeImports` feature of the TypeScript language service API. This is the same as using the "Organize Imports" action in VS Code.

**Features**

- 👌 No runtime dependencies; `prettier` and a TypeScript 7.1 nightly are the required peers.
- 📦 ESM only, shipped as a single bundled file with type declarations.
- 💪 Supports `.js`, `.jsx`, `.ts`, `.tsx` and `.vue` files.
- 🚀 Zero config.
- 🤓 No more weird diffs or annoying merge conflicts in PRs caused by import statements.
- 🤯 If your editor supports auto-imports, you'll stop thinking about your imports so much that you won't even care about their order anymore.

**Caveat**

This plugin inherits, extends, and then overrides the built-in Prettier parsers for `babel`, `babel-ts`, `typescript` and `vue`. This means that it is incompatible with other plugins that do the same; only the last loaded plugin that exports one of those parsers will function.

## Installation

```sh
npm install --save-dev @sroussey/prettier-plugin-organize-imports
```

_`prettier` and `typescript` are the required peer dependencies. This package is ESM only and requires Prettier 3._

### TypeScript

`typescript` is a required peer dependency, and it has to be a **7.1 nightly**:

```sh
npm install --save-dev typescript@next
```

TypeScript 7.0 dropped the programmatic language service API this plugin was built on ([announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)), which is why version 5 of this plugin shipped its own `@typescript/typescript6` instead. TypeScript 7.1 reintroduces a programmatic API under the `typescript/unstable` entry points, so the plugin can go back to organizing imports with the same TypeScript your project and your editor use.

That API only exists in the nightlies and is explicitly unstable, hence the `>=7.1.0-dev` peer range: it excludes 7.0 and earlier, which cannot serve this plugin at all. Expect the range to tighten once 7.1 is released.

## Usage

Automatic plugin discovery [has been removed in Prettier 3](https://prettier.io/blog/2023/07/05/3.0.0.html#plugin-search-feature-has-been-removed-14759httpsgithubcomprettierprettierpull14759-by-fiskerhttpsgithubcomfisker). Thus you need to configure Prettier to use the plugin according to the [Plugins docs](https://prettier.io/docs/en/plugins.html), for example by adding it to the `plugins` config option:

```json
{
  "plugins": ["@sroussey/prettier-plugin-organize-imports"]
}
```

This works from a CommonJS project too — Prettier loads plugins with a dynamic `import()`, so the plugin being ESM doesn't constrain your own project's module format.

## Configuration

### Skip Files

Files containing the substring `// organize-imports-ignore` or `// tslint:disable:ordered-imports` are skipped.

### Skip Destructive Code Actions

If you don't want destructive code actions (like removing unused imports), you can enable the option `organizeImportsSkipDestructiveCodeActions` via your Prettier config.

```json
{
  "organizeImportsSkipDestructiveCodeActions": true
}
```

## Compatibility

### ESLint

For compatibility with [ESLint](https://eslint.org/) or other linters, see ["Integrating with Linters"](https://prettier.io/docs/en/integrating-with-linters.html) in the Prettier docs. You should have any import order rules/plugins disabled.

### React

Depending on your configuration, if you need the `React` import to stay even if it's "unused" (i.e. only needed for the JSX factory), make sure to have the `jsx` option set to `react` in your `tsconfig.json`. For more details [click here](https://www.typescriptlang.org/docs/handbook/jsx.html#basic-usage).

### Vue.js

Make sure that you have the optional peer dependency `vue-tsc` installed.

```
npm install --save-dev vue-tsc
```

If you're using Vue.js with Pug templates, you'll also need to install `@vue/language-plugin-pug` as a dev dependency, and configure it in `vueCompilerOptions` (see [usage](https://www.npmjs.com/package/@vue/language-plugin-pug)).

## Debug Logs

If something doesn't work, you can try to prefix your `prettier` command with `DEBUG=true` which will enable this plugin to print some logs.

## Development

This package is written in TypeScript and uses [Bun](https://bun.sh) as its package manager, bundler and test runner.

```sh
bun install        # install dependencies
bun run build      # bundle src/ to dist/index.js (ESM) and emit type declarations
bun run typecheck  # typecheck the library and the tests
bun run format     # format with prettier
bun test           # run the test suite against the built plugin
bun run test       # typecheck, build, then run the test suite (what CI runs)
```

`bun test` runs against `dist/index.js`, i. e. the artifact that actually gets published, so run `bun run build` after changing anything under `src/`.

`typescript` is pinned to the `next` dist-tag, so `bun install` picks up a fresh 7.1 nightly and `bun.lock` records which one. A nightly can break the build on a day nobody touched the code; when it does, check the nightly's changes to `typescript/unstable` before assuming the plugin is at fault.

## Rationale/Disclaimer

This plugin acts outside of [Prettier's scope](https://prettier.io/docs/en/rationale#what-prettier-is-_not_-concerned-about) because _"Prettier only prints code. It does not transform it."_, and technically sorting is a code transformation because it changes the AST (this plugin even removes code, i. e. unused imports). In my opinion however, the import statements are not _really_ part of the code, they are merely directives that instruct the module system where to find the code (only true as long as your imports are side-effects free regarding the global scope, i. e. import order doesn't matter), comparable with `using` directives in C# or `#include` preprocessing directives in C. Therefore the practical benefits outweigh sticking with the philosophy in this case.

## Changelog

See [changelog.md](/changelog.md).

## License

[MIT](/license).
