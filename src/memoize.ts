/**
 * Simple memoization utility that only uses the first argument as cache key and has no memory limit.
 */
export const memoize = <Key, Rest extends readonly unknown[], Result>(
	f: (key: Key, ...rest: Rest) => Result,
): ((key: Key, ...rest: Rest) => Result) => {
	const cache = new Map<Key, Result>();

	return (key, ...rest) => {
		if (cache.has(key)) {
			// `Map#get` widens to `Result | undefined`, but `has` already proved the entry exists,
			// and `Result` itself may legitimately include `undefined`.
			return cache.get(key) as Result;
		}

		const result = f(key, ...rest);

		cache.set(key, result);

		return result;
	};
};
