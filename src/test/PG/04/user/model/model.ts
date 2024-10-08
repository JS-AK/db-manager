// ----- Dependencies --------------------------
import { PG } from "../../../index.js";

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
const createField = { title: "created_at", type: "timestamp" } as const;
const updateField = { title: "updated_at", type: "timestamp" } as const;
const tableFields: TableKeys[] = [
	"id",

	"id_user_role",

	"first_name",
	"last_name",

	"deleted_at",
	"is_deleted",

	"created_at",
	"updated_at",
];

// ----- queries -----------------------
// const queries = {

// };
