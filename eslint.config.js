import { fixupPluginRules } from "@eslint/compat";
import stylistic from "@stylistic/eslint-plugin";
import sortDestructureKeys from "eslint-plugin-sort-destructure-keys";
import sortExports from "eslint-plugin-sort-exports";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["build/**", "eslint.config.js"],
	},
	...tseslint.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			ecmaVersion: 13,
			globals: {
				...globals.browser,
				...globals.jest,
				...globals.node,
			},
			sourceType: "module",
		},
		plugins: {
			"@stylistic": stylistic,
			"sort-destructure-keys": sortDestructureKeys,
			"sort-exports": fixupPluginRules(sortExports),
		},
		rules: {
			"@stylistic/indent": [
				"error",
				"tab",
				{
					SwitchCase: 1,
					ignoredNodes: [
						"TSUnionType",
						"ArrowFunctionExpression > BlockStatement",
						"NoSubstitutionTemplateLiteral",
						"TemplateLiteral",
						"TSTypeParameterInstantiation",
					],
				},
			],
			"@stylistic/member-delimiter-style": ["error", {
				multiline: {
					delimiter: "semi",
					requireLast: true,
				},
				singleline: {
					delimiter: "semi",
					requireLast: true,
				},
			}],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/space-before-function-paren": [
				"warn",
				{
					anonymous: "never",
					asyncArrow: "always",
					named: "never",
				},
			],
			"@stylistic/type-annotation-spacing": "error",
			"@typescript-eslint/no-unused-vars": [
				"warn", {
					args: "all",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
					ignoreRestSiblings: true,
					varsIgnorePattern: "^_",
				},
			],
			"array-bracket-spacing": ["error", "never"],
			"arrow-parens": ["error", "always"],
			"comma-dangle": ["error", "always-multiline"],
			"comma-spacing": ["error", { after: true, before: false }],
			"key-spacing": ["error", { afterColon: true, beforeColon: false }],
			"keyword-spacing": ["error", { after: true, before: true }],
			"new-cap": ["error", { properties: false }],
			"no-console": ["warn"],
			"no-mixed-spaces-and-tabs": ["warn"],
			"no-multi-spaces": "error",
			"no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
			"no-tabs": ["error", { allowIndentationTabs: true }],
			"no-unused-vars": ["off"],
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
			"require-atomic-updates": "off",
			semi: ["error", "always"],
			"semi-spacing": ["error", { after: true, before: false }],
			"sort-destructure-keys/sort-destructure-keys": ["error", { caseSensitive: true }],
			"sort-exports/sort-exports": ["error", { sortDir: "asc", sortExportKindFirst: "type" }],
			"sort-imports": ["error", {
				allowSeparatedGroups: true,
				ignoreCase: false,
				ignoreDeclarationSort: false,
				ignoreMemberSort: false,
				memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
			}],
			"sort-keys": ["error", "asc", {
				allowLineSeparatedGroups: true,
				minKeys: 2,
			}],
			"space-before-blocks": ["error", {
				classes: "always",
				functions: "always",
				keywords: "always",
			}],
			"space-in-parens": ["error", "never"],
			"space-infix-ops": "error",
		},
	},
);
