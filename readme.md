[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/sroussey/prettier-plugin-organize-imports/test.yml?label=CI)](https://github.com/sroussey/prettier-plugin-organize-imports/actions?query=branch%3Amaster)

# Prettier Plugin: Organize Imports

> Make sure that your import statements stay consistent no matter who writes them and what their preferences are.

_This is a fork of [`prettier-plugin-organize-imports`](https://github.com/simonhaenisch/prettier-plugin-organize-imports) published as `@sroussey/prettier-plugin-organize-imports`. It brings its own TypeScript instead of relying on the project's (which TypeScript 7 made impossible), ships as **ESM only** (so it requires Prettier 3), and is written in TypeScript, built and tested with [Bun](https://bun.sh). The plugin's behaviour and options are otherwise unchanged._

A plugin that makes Prettier organize your imports (i. e. sorts, combines and removes unused ones) using the `organizeImports` feature of the TypeScript language service API. This is the same as using the "Organize Imports" action in VS Code.

**Features**

- 👌 One dependency (its own TypeScript), and `prettier` as the only required peer.
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

_`prettier` is the only required peer dependency. This package is ESM only and requires Prettier 3._

### TypeScript

The plugin brings its own TypeScript. It depends on [`@typescript/typescript6`](https://www.npmjs.com/package/@typescript/typescript6) and organizes imports with that language service, so it works whatever version of `typescript` your project has — or none at all.

This is deliberate. TypeScript 7.0 dropped the programmatic language service API this plugin is built on ([announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)), so following the project's own TypeScript is no longer possible. Owning the dependency also means one less peer dependency to keep in range, and the same sorting behaviour across every project.

The trade-off is that the plugin sorts with TypeScript 6's language service rather than your project's version, so in principle it can disagree with your editor's own "Organize Imports" action if you're on a different one.

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

The scripts call `tsc6` rather than `tsc`: `typescript` and `@typescript/old` both claim the `tsc` bin, so which one `tsc` resolves to depends on install order. `typescript` itself is only a devDependency here, because `@vue/language-core`'s types import from it.

## Rationale/Disclaimer

This plugin acts outside of [Prettier's scope](https://prettier.io/docs/en/rationale#what-prettier-is-_not_-concerned-about) because _"Prettier only prints code. It does not transform it."_, and technically sorting is a code transformation because it changes the AST (this plugin even removes code, i. e. unused imports). In my opinion however, the import statements are not _really_ part of the code, they are merely directives that instruct the module system where to find the code (only true as long as your imports are side-effects free regarding the global scope, i. e. import order doesn't matter), comparable with `using` directives in C# or `#include` preprocessing directives in C. Therefore the practical benefits outweigh sticking with the philosophy in this case.

## Changelog

See [changelog.md](/changelog.md).

## License

[MIT](/license).
