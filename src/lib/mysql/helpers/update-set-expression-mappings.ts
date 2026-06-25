import * as Types from "../model/types.js";

/**
 * A mapping of update operator kinds to their corresponding SQL SET expression generators.
 *
 * This `Map` associates an operator kind (e.g., `$inc`, `$concat`) with a function that builds
 * the right-hand side of a MySQL `UPDATE` assignment using a parameterized placeholder.
 *
 * @property $concat - Generates `column = CONCAT(column, ?)`.
 * @property $inc - Generates `column = column + ?`.
 * @property $max - Generates `column = GREATEST(column, ?)`.
 * @property $min - Generates `column = LEAST(column, ?)`.
 * @property $mul - Generates `column = column * ?`.
 * @property $prepend - Generates `column = CONCAT(?, column)`.
 * @property $set - Generates `column = ?`.
 */
export const updateSetExpressionMappings: Map<
	Types.TUpdateOperator,
	(column: string, placeholder: string) => string
> = new Map([
	[
		"$concat",
		(column, placeholder) => `${column} = CONCAT(${column}, ${placeholder})`,
	],
	[
		"$inc",
		(column, placeholder) => `${column} = ${column} + ${placeholder}`,
	],
	[
		"$max",
		(column, placeholder) => `${column} = GREATEST(${column}, ${placeholder})`,
	],
	[
		"$min",
		(column, placeholder) => `${column} = LEAST(${column}, ${placeholder})`,
	],
	[
		"$mul",
		(column, placeholder) => `${column} = ${column} * ${placeholder}`,
	],
	[
		"$prepend",
		(column, placeholder) => `${column} = CONCAT(${placeholder}, ${column})`,
	],
	[
		"$set",
		(column, placeholder) => `${column} = ${placeholder}`,
	],
]);
