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
}

// ----- Table properties ----------------------
const tableName = "user_roles"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = "created_at"; // created field
const updateField = "updated_at"; // updated field
const tableFields: TableKeys[] = [
	"created_at",
	"id",
	"title",
	"updated_at",
];

// ----- queries -----------------------
// const queries = {

// };
