// ----- Dependencies --------------------------
import { PG } from "../../../../index.js";

import { TableKeys } from "./types.js";

// ----- Class ------------------------------
export class Model extends PG.BaseModel {
	constructor(creds: PG.ModelTypes.TDBCreds, options?: PG.ModelTypes.TDBOptions) {
		super(
			{
				createField,
				primaryKey,
				tableFields,
				tableName,
				updateField,
			},
			creds,
			options,
		);
	}

	async test() {
		return (await this.pool.query<{ test: boolean; }>(queries.test())).rows[0];
	}
}

// ----- Table properties ----------------------
const tableName = "test_table_pg_01"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = "created_at"; // created field
const updateField = "updated_at"; // updated field
const tableFields: TableKeys[] = [
	"created_at", // -> create date
	"description", // -> description
	"id", // -> id
	"meta", // -> meta
	"number_range", // -> number_range
	"title", // -> title
	"updated_at", // -> update date
];

// ----- queries -----------------------
const queries = {
	test() {
		return "SELECT 1=1 AS test;";
	},
};
