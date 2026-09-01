type OrganizeImportsTypeOrder = 'last' | 'first' | 'inline';

declare module 'prettier' {
	interface Options {
		organizeImportsSkipDestructiveCodeActions?: boolean;
		organizeImportsTypeOrder?: OrganizeImportsTypeOrder;
	}
	interface ParserOptions {
		organizeImportsSkipDestructiveCodeActions?: boolean;
		organizeImportsTypeOrder?: OrganizeImportsTypeOrder;
	}
}

export {};
