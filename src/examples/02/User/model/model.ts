// ----- Dependencies ----------------------------
import { MYSQL } from "../../../../index.js";

import { TableKeys } from "./types.js";

// ----- Class ------------------------------
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
}

// ----- Table properties ----------------------
const tableName = "users"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = { title: "created_at", type: "timestamp" } as const;
const updateField = { title: "updated_at", type: "timestamp" } as const;
const tableFields: TableKeys[] = [
	"created_at", // -> create date
	"id", // -> id
	"firstName", // -> firstName
	"lastName", // -> lastName
	"updated_at", // -> update date
];

// ----- queries -----------------------
// const queries = {
// };
