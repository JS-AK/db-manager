module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		es6: true,
		jasmine: true,
		jest: true,
		jquery: false,
		node: true,
	},
	extends: [
		"plugin:@typescript-eslint/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 13,
		sourceType: "module",
	},
	plugins: [
		"@typescript-eslint",
		"sort-destructure-keys",
		"sort-exports",
	],
	root: true,
	rules: {
		"@typescript-eslint/indent": [
			"error",
			"tab",
			{
				SwitchCase: 1,
				ignoredNodes: [
					"TSUnionType",
					"ArrowFunctionExpression > BlockStatement",
					"NoSubstitutionTemplateLiteral",
					"TemplateLiteral",
					/* "TSTypeAliasDeclaration *", */
				],
			},
		],
		"@typescript-eslint/member-delimiter-style": ["error", {
			multiline: {
				delimiter: "semi",
				requireLast: true,
			},
			singleline: {
				delimiter: "semi",
				requireLast: true,
			},
		}],
		"@typescript-eslint/semi": ["error", "always"],
		"array-bracket-spacing": ["error", "never"],
		"arrow-parens": ["error", "always"],
		"comma-dangle": ["error", "always-multiline"],
		"comma-spacing": ["error", { after: true, before: false }],
		"key-spacing": ["error", { afterColon: true, beforeColon: false }],
		"new-cap": ["error", { properties: false }],
		"no-console": ["warn"],
		"no-mixed-spaces-and-tabs": ["warn"],
		"no-multi-spaces": "error",
		"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
		"no-tabs": ["error", { allowIndentationTabs: true }],
		"no-var": ["error"],
		"object-curly-newline": [
			"error",
			{
				ExportDeclaration: { minProperties: 3, multiline: true },
				ImportDeclaration: { minProperties: 3, multiline: true },
				ObjectExpression: { consistent: true, multiline: true },
				ObjectPattern: { consistent: true, multiline: true },
			},
		],
		"object-curly-spacing": [
			"error",
			"always",
			{ objectsInObjects: true },
		],
		"object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
		"object-shorthand": ["error", "always"],
		"operator-linebreak": ["error", "before"],
		"padded-blocks": ["error", { blocks: "never" }],
		"padding-line-between-statements": [
			"error",
			{ blankLine: "always", next: "*", prev: "directive" },
			{ blankLine: "any", next: "directive", prev: "directive" },
			{ blankLine: "always", next: "*", prev: ["const", "let", "var"] },
			{ blankLine: "any", next: ["const", "let", "var"], prev: ["const", "let", "var"] },
			{ blankLine: "always", next: "return", prev: "*" },
			{ blankLine: "any", next: "*", prev: ["case", "default"] },
		],
		"quote-props": ["error", "as-needed"],
		quotes: ["warn", "double"],
		"require-atomic-updates": 0,
		semi: ["error", "always"],
		"semi-spacing": [2, { after: true, before: false }],
		"sort-destructure-keys/sort-destructure-keys": [2, { caseSensitive: true }],
		"sort-exports/sort-exports": ["error", { sortDir: "asc" }],
		"sort-imports": ["error", {
			allowSeparatedGroups: true,
			ignoreCase: false,
			ignoreDeclarationSort: false,
			ignoreMemberSort: false,
			memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
		}],
		"sort-keys": ["error", "asc", { minKeys: 2 }],
		"space-before-blocks": ["error", {
			classes: "always",
			functions: "always",
			keywords: "always",
		}],
		"space-before-function-paren": [
			"warn",
			{
				anonymous: "never",
				asyncArrow: "always",
				named: "never",
			},
		],
		"space-in-parens": ["error", "never"],
		"space-infix-ops": "error",
	},
};
