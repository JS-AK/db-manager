import * as Types from "../model/types.js";

/**
 * A mapping of operators to their corresponding SQL expression generators.
 *
 * This `Map` associates a string operator key (e.g., `$custom`, `$between`) with a function that takes a field and an order number,
 * and returns a tuple containing the generated SQL string and the updated order number.
 *
 * @property $custom - Generates a custom SQL expression using the field's key and sign.
 * @property $between - Generates a SQL `BETWEEN` expression with two placeholders.
 * @property $in - Generates a SQL `= ANY` expression for array inclusion.
 * @property $like - Generates a SQL `LIKE` expression for pattern matching.
 * @property $ilike - Generates a SQL `ILIKE` expression for case-insensitive pattern matching.
 * @property $nin - Generates a SQL `NOT = ANY` expression for array exclusion.
 * @property $nbetween - Generates a SQL `NOT BETWEEN` expression with two placeholders.
 * @property $nlike - Generates a SQL `NOT LIKE` expression for negated pattern matching.
 * @property $nilike - Generates a SQL `NOT ILIKE` expression for negated case-insensitive pattern matching.
 * @property $withoutParameters - Returns the field's key as the SQL expression without any parameters.
 */
export const operatorMappings: Map<
	Types.TOperator,
	(el: Types.TField, orderNumber: number) => [string, number]
> = new Map([
	[
		"$custom",
		(el: Types.TField, orderNumber: number) => [`${el.key} ${el.sign} $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$between",
		(el: Types.TField, orderNumber: number) => [`${el.key} BETWEEN $${orderNumber + 1} AND $${orderNumber + 2}`, orderNumber + 2],
	],
	[
		"$in",
		(el: Types.TField, orderNumber: number) => [`${el.key} = ANY ($${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$like",
		(el: Types.TField, orderNumber: number) => [`${el.key} LIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$ilike",
		(el: Types.TField, orderNumber: number) => [`${el.key} ILIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$nin",
		(el: Types.TField, orderNumber: number) => [`NOT (${el.key} = ANY ($${orderNumber + 1}))`, orderNumber + 1],
	],
	[
		"$nbetween",
		(el: Types.TField, orderNumber: number) => [`${el.key} NOT BETWEEN $${orderNumber + 1} AND $${orderNumber + 2}`, orderNumber + 2],
	],
	[
		"$nlike",
		(el: Types.TField, orderNumber: number) => [`${el.key} NOT LIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$nilike",
		(el: Types.TField, orderNumber: number) => [`${el.key} NOT ILIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$withoutParameters",
		(el: Types.TField, orderNumber: number) => [el.key, orderNumber],
	],
]);
