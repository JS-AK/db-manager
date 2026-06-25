import * as Types from "../model/types.js";

import { buildUpdateSetExpression } from "./build-update-set-expression.js";

/**
 * Builds the SQL SET clause for an update query from prepared update clauses.
 *
 * @param clauses - The update clauses containing column names and operator kinds.
 *
 * @returns A comma-separated SQL SET clause.
 */
export function buildUpdateSetSql(clauses: Types.TUpdateClause[]): string {
	return clauses.map((clause) => buildUpdateSetExpression(clause.column, clause.kind, "?")).join(",");
}
