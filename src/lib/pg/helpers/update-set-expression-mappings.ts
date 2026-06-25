import * as Types from "../model/types.js";

/**
 * A mapping of update operator kinds to their corresponding SQL SET expression generators.
 *
 * This `Map` associates an operator kind (e.g., `$inc`, `$concat`) with a function that builds
 * the right-hand side of a PostgreSQL `UPDATE` assignment using a parameterized placeholder.
 *
 * @property $concat - Generates `column = column || $N`.
 * @property $inc - Generates `column = column + $N`.
 * @property $max - Generates `column = GREATEST(column, $N)`.
 * @property $min - Generates `column = LEAST(column, $N)`.
 * @property $mul - Generates `column = column * $N`.
 * @property $prepend - Generates `column = $N || column`.
 * @property $set - Generates `column = $N`.
 */
export const updateSetExpressionMappings: Map<
	Types.TUpdateOperator,
	(column: string, placeholder: string) => string
> = new Map([
	[
		"$concat",
		(column, placeholder) => `${column} = ${column} || ${placeholder}`,
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
		(column, placeholder) => `${column} = ${placeholder} || ${column}`,
	],
	[
		"$set",
		(column, placeholder) => `${column} = ${placeholder}`,
	],
]);
