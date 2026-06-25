/**
 * Normalizes a value before binding it to a MySQL placeholder.
 *
 * mysql2 expands plain objects in bind arrays into `SET`-style fragments, which breaks
 * single-column INSERT/UPDATE placeholders for JSON fields. Objects and arrays are
 * serialized to JSON strings instead.
 */
export function normalizeMysqlBindValue(value: unknown): unknown {
	if (value === null || value === undefined) return value;
	if (value instanceof Date) return value;
	if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) return value;
	if (typeof value === "object") return JSON.stringify(value);

	return value;
}
