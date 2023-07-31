// ----- Dependiences --------------------------
import { MYSQL } from "../../../../index.js";
import { TableKeys } from "./types.js";

// ----- Reexport types ------------------------
export * as Types from "./types.js";

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
		return (await this.pool.query<MYSQL.ModelTypes.RowDataPacket[]>(queries.test()))[0][0];
	}
}

// ----- Table propertires ----------------------
const tableName = "test_table"; // table from DB
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
