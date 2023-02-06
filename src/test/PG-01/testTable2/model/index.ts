// ----- Dependiences ----------------------------
import { PG } from "../../../../index.js";
import { TableKeys } from "./types.js";

// ----- Reexport types ------------------------
export * as Types from "./types.js";

// ----- Class ------------------------------
export class Model extends PG.BaseModel {
	constructor(creds: PG.ModelTypes.TDBCreds) {
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
		return (await this.pool.query(queries.test())).rows[0];
	}
}

// ----- Table propertires ----------------------
const tableName = "test_table_2"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = "created_at"; // created field
const updateField = "updated_at"; // updated field
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
