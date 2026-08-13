const test = require('ava').default;
const { loadTypeScript } = require('../lib/load-typescript');

test('uses typescript when it has the language service API', (t) => {
	const languageService = { createLanguageService() {} };

	const ts = loadTypeScript((id) => {
		t.is(id, 'typescript');
		return languageService;
	});

	t.is(ts, languageService);
});

test('falls back to @typescript/typescript6 when typescript has no API', (t) => {
	const typescript6 = { createLanguageService() {}, version: '6.0.2' };

	const ts = loadTypeScript((id) => {
		if (id === 'typescript') {
			return { version: '7.0.2' };
		}

		if (id === '@typescript/typescript6') {
			return typescript6;
		}

		throw new Error(`unexpected module ${id}`);
	});

	t.is(ts, typescript6);
});

test('throws a helpful error when no language service API is available', (t) => {
	const error = t.throws(() =>
		loadTypeScript((id) => {
			if (id === 'typescript') {
				return { version: '7.0.2' };
			}

			throw new Error(`Cannot find module '${id}'`);
		}),
	);

	t.regex(error.message, /TypeScript 7\.0/);
	t.regex(error.message, /@typescript\/typescript6/);
});
