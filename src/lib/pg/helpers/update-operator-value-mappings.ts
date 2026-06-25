import * as Types from "../model/types.js";

/**
 * A mapping of update operators to their corresponding operand parsers.
 *
 * This `Map` associates an operator key (e.g., `$inc`, `$concat`) with a function that validates
 * the operand and returns the operator kind with its value for the SQL query.
 *
 * @property $concat - Parses a string operand for concatenation (`||`).
 * @property $inc - Parses a numeric operand for increment (`+`).
 * @property $max - Parses a numeric or string operand for `GREATEST`.
 * @property $min - Parses a numeric or string operand for `LEAST`.
 * @property $mul - Parses a numeric operand for multiplication (`*`).
 * @property $prepend - Parses a string operand for prepending (`||`).
 * @property $set - Parses any operand for direct assignment (`=`).
 */
export const updateOperatorValueMappings: Map<
	Types.TUpdateOperator,
	(value: unknown) => Types.TUpdateOperatorParseResult | null
> = new Map([
	[
		"$concat",
		(value): Types.TUpdateOperatorParseResult | null => typeof value === "string"
			? { kind: "$concat", operand: value }
			: null,
	],
	[
		"$inc",
		(value): Types.TUpdateOperatorParseResult | null => typeof value === "number"
			? { kind: "$inc", operand: value }
			: null,
	],
	[
		"$max",
		(value): Types.TUpdateOperatorParseResult | null => typeof value === "number" || typeof value === "string"
			? { kind: "$max", operand: value }
			: null,
	],
	[
		"$min",
		(value): Types.TUpdateOperatorParseResult | null => typeof value === "number" || typeof value === "string"
			? { kind: "$min", operand: value }
			: null,
	],
	[
		"$mul",
		(value): Types.TUpdateOperatorParseResult | null => typeof value === "number"
			? { kind: "$mul", operand: value }
			: null,
	],
	[
		"$prepend",
		(value): Types.TUpdateOperatorParseResult | null => typeof value === "string"
			? { kind: "$prepend", operand: value }
			: null,
	],
	[
		"$set",
		(value): Types.TUpdateOperatorParseResult | null => ({ kind: "$set", operand: value }),
	],
]);
