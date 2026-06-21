import type { PickRowFields } from "../../../../../../shared-types/index.js";

/** Fields allowed in SELECT via `selected`. Keys are SQL identifiers. */
export type EntityListed = Pick<TableFields,
	| "\"typeID\""
	| "\"typeName\""
>;

/** Row shape returned by node-pg for `EntityListed`. Keys are JS property names. */
export type RowEntityListed = PickRowFields<TableFields, keyof EntityListed>;

export type SearchFields = Partial<TableFields>;

/**
 * SQL column identifiers as TypeScript keys.
 * Use these keys in params, selected, orderBy and tableFields.
 */
export type TableFields = {
	"\"typeID\"": number;
	"\"groupID\"": number;
	"\"typeName\"": string;
	published: boolean | null;
};
