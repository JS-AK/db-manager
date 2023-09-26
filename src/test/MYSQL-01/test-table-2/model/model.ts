// ----- Dependencies --------------------------
import { MYSQL } from "../../../../index.js";

import { TableKeys } from "./types.js";

// ----- Class ---------------------------------
export class Model extends MYSQL.BaseModel {
	constructor(creds: MYSQL.ModelTypes.TDBCreds) {
		super(
			{
				createField,
				primaryKey,
				tableFields,
				tableName,
				updateField,
			},
			creds,
		);
	}

	async test() {
		return (await this.pool.query<(MYSQL.ModelTypes.RowDataPacket & { test: boolean; })[]>(queries.test()))[0][0];
	}
}

// ----- Table properties ----------------------
const tableName = "test_table_2"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = { title: "created_at", type: "unix_timestamp" } as const;
const updateField = { title: "updated_at", type: "unix_timestamp" } as const;
const tableFields: TableKeys[] = [
	"created_at", // -> create date
	"id", // -> id
	"title", // -> title
	"updated_at", // -> update date
];

// ----- queries -----------------------
const queries = {
	test() {
		return `
			SELECT 1=1 AS test;
		`;
	},
};
