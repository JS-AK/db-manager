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
const tableName = "users"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = { title: "created_at", type: "unix_timestamp" } as const;
const updateField = { title: "updated_at", type: "unix_timestamp" } as const;
const tableFields: TableKeys[] = [
	"created_at",
	"first_name",
	"id",
	"id_user_role",
	"is_deleted",
	"last_name",
	"updated_at",
];

// ----- queries -----------------------
// const queries = {

// };
