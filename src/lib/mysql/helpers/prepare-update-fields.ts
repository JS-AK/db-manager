import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "../model/types.js";

import { normalizeMysqlBindValue } from "./normalize-mysql-bind-value.js";
import { parseUpdateOperatorValue } from "./parse-update-operator-value.js";

/**
 * Prepares update field parameters for SQL generation.
 *
 * Converts raw update params into update clauses and values. Operator objects such as `{ $inc: -5 }`
 * are parsed into atomic update operations; plain values are treated as `$set`.
 * Fields with `undefined` values are skipped.
 *
 * @param updateFields - The fields to update.
 * @param [options] - Optional settings for preparing update fields.
 * @param [options.tableFieldsSet] - The set of known table fields used for identifier quoting.
 * @param [options.rawColumns] - When true, column names are used as-is without identifier quoting.
 *
 * @returns An object containing the update clauses and their corresponding values.
 */
export function prepareUpdateFields(
	updateFields: SharedTypes.TRawParams,
	options?: { rawColumns?: boolean; tableFieldsSet?: Set<string>; },
): { clauses: Types.TUpdateClause[]; values: unknown[]; } {
	const clearedUpdate = SharedHelpers.clearUndefinedFields(updateFields);
	const clauses: Types.TUpdateClause[] = [];
	const values: unknown[] = [];

	for (const [key, value] of Object.entries(clearedUpdate)) {
		const column = options?.rawColumns
			? key
			: SharedHelpers.quoteMysqlIdent(key, { tableFieldsSet: options?.tableFieldsSet });
		const operator = parseUpdateOperatorValue(value);

		if (operator) {
			clauses.push({ column, kind: operator.kind });
			values.push(operator.operand);
		} else {
			clauses.push({ column, kind: "$set" });
			values.push(normalizeMysqlBindValue(value));
		}
	}

	return { clauses, values };
}
