// ----- Dependencies --------------------------
import { PG } from "../../../../index.js";

import { TableKeys } from "./types.js";

// ----- Class ------------------------------
export class Model extends PG.Model.BaseTable {
	async test() {
		return (await this.pool.query<{ test: boolean; }>(queries.test())).rows[0];
	}
}

// ----- Table properties ----------------------
const tableName = "test_table_01"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = { title: "created_at", type: "timestamp" } as const;
const updateField = { title: "updated_at", type: "timestamp" } as const;
const tableFields: TableKeys[] = [
	"id", // -> id

	"books", // -> books
	"description", // -> description
	"checklist", // -> checklist
	"meta", // -> meta
	"number_key", // -> number_key
	"number_range", // -> number_range
	"title", // -> title

	"created_at", // -> create date
	"updated_at", // -> update date
];

// ----- queries -----------------------
const queries = {
	test() {
		return "SELECT 1=1 AS test;";
	},
};

export const initModel = (creds: PG.ModelTypes.TDBCreds) => {
	return new Model(
		{ createField, primaryKey, tableFields, tableName, updateField },
		creds,
	);
};
