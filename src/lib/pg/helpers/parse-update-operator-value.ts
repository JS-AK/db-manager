import * as Types from "../model/types.js";

import { updateOperatorValueMappings } from "./update-operator-value-mappings.js";

/**
 * Parses an update field value into an update operator descriptor.
 *
 * Accepts objects with exactly one operator key (e.g., `{ $inc: -5 }`).
 * Plain values and objects with zero or multiple operator keys return `null`.
 *
 * @param value - The update field value to parse.
 *
 * @returns The parsed operator kind and operand, or `null` if the value is not a valid operator object.
 */
export function parseUpdateOperatorValue(value: unknown): Types.TUpdateOperatorParseResult | null {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj);

	if (keys.length !== 1) {
		return null;
	}

	const key = keys[0] as Types.TUpdateOperator;
	const parseOperator = updateOperatorValueMappings.get(key);

	if (!parseOperator) {
		return null;
	}

	return parseOperator(obj[key]);
}
