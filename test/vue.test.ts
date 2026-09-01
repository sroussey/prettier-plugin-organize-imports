import { expect, test } from 'bun:test';
import ts from '@typescript/typescript6';
import { nthLine, prettify } from './utils.js';

test('works with TypeScript code inside Vue files', async () => {
	const code = `
		<script lang="ts">
			import  {defineComponent,compile} from 'vue';
			console.log(compile);
			export default defineComponent({});
		</script>
	`;

	const formattedCode = await prettify(code, { filepath: 'file.vue' });

	expect(nthLine(1)(formattedCode)).toBe(`import { compile, defineComponent } from "vue";`);
});

test('works with Vue setup scripts', async () => {
	const code = `
		<script setup lang="ts">
			import  {defineComponent,compile} from 'vue';
			export default defineComponent({});
		</script>
	`;

	const formattedCode = await prettify(code, { filepath: 'file.vue' });

	expect(nthLine(1)(formattedCode)).toBe(`import { defineComponent } from "vue";`);
});

test('preserves new lines and comments in Vue files', async () => {
	const code = `<script lang="ts">
import { defineComponent, ref } from "vue";
export default defineComponent({
  setup() {
    // please don't break me
    const test = ref("");

    return { test };
  },
});
</script>

<style></style>
`;

	const formattedCode = await prettify(code, { filepath: 'file.vue' });

	expect(formattedCode).toBe(code);
});

test('does not remove imports when Vue components use kebab case', async () => {
	const code = `<template>
  <div>
    <n-divider />
  </div>
</template>

<script setup lang="ts">
import { NDivider } from "naive-ui";
</script>
`;

	const formattedCode = await prettify(code, { filepath: 'file.vue' });

	expect(formattedCode).toBe(code);
});

test('works with pug templates in Vue files', async () => {
	const code = `<script setup lang="ts">
import { Foo, Bar } from "@/components";
</script>

<template lang="pug">
Foo
</template>
`;

	const expected = `<script setup lang="ts">
import { Foo } from "@/components";
</script>

<template lang="pug">
Foo
</template>
`;

	const formattedCode = await prettify(code, { filepath: 'file.vue' });

	expect(formattedCode).toBe(expected);
});

test('works with Volar language plugins when not running from the project root', async () => {
	const originalGetCurrentDir = ts.sys.getCurrentDirectory;

	ts.sys.getCurrentDirectory = () => '/';

	const code = `<script setup lang="ts">
import { Foo, Bar } from "@/components";
</script>

<template lang="pug">
Foo
</template>
`;

	const expected = `<script setup lang="ts">
import { Foo } from "@/components";
</script>

<template lang="pug">
Foo
</template>
`;

	try {
		const formattedCode = await prettify(code, { filepath: 'file.vue' });

		expect(formattedCode).toBe(expected);
	} finally {
		ts.sys.getCurrentDirectory = originalGetCurrentDir;
	}
});
