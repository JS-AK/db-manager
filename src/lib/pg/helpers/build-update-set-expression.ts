import * as Types from "../model/types.js";

import { updateSetExpressionMappings } from "./update-set-expression-mappings.js";

/**
 * Builds a single SQL SET assignment for an update operator.
 *
 * @param column - The quoted column identifier.
 * @param kind - The update operator kind.
 * @param placeholder - The parameterized placeholder (e.g., `$3`).
 *
 * @returns The SQL assignment expression (e.g., `"tokens" = "tokens" + $3`).
 *
 * @throws {Error} Throws an error if the operator kind is not supported.
 */
export function buildUpdateSetExpression(
	column: string,
	kind: Types.TUpdateOperator,
	placeholder: string,
): string {
	const buildExpression = updateSetExpressionMappings.get(kind);

	if (!buildExpression) {
		throw new Error(`Invalid update operator kind: ${kind}`);
	}

	return buildExpression(column, placeholder);
}
