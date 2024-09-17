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
	(el: Types.TField) => string
> = new Map([
	["$custom", (element: Types.TField) => `${element.key} ${element.sign} ?`],
	["$between", (el: Types.TField) => `${el.key} BETWEEN ? AND ?`],
	["$in", (element: Types.TField) => ` ${element.key} IN (?)`],
	["$like", (element: Types.TField) => ` ${element.key} LIKE ?`],
	["$ilike", (element: Types.TField) => ` LOWER(${element.key}) LIKE LOWER(?)`],
	["$nin", (element: Types.TField) => ` ${element.key} NOT IN (?)`],
	["$nbetween", (el: Types.TField) => `${el.key} NOT BETWEEN ? AND ?`],
	["$nlike", (element: Types.TField) => ` ${element.key} NOT LIKE ?`],
	["$nilike", (element: Types.TField) => ` LOWER(${element.key}) NOT LIKE LOWER(?)`],
	["$withoutParameters", (element: Types.TField) => element.key],
]);
