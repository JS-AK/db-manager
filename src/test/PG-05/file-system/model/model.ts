// ----- Dependencies --------------------------
import { PG } from "../../../../index.js";

import { TableKeys } from "./types.js";

// ----- Class ------------------------------
export class Model extends PG.Model.BaseTable {
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
const tableName = "file_system"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = { title: "created_at", type: "timestamp" } as const;
const updateField = { title: "updated_at", type: "timestamp" } as const;
const tableFields: TableKeys[] = [
	"created_at",
	"id",
	"is_folder",
	"name",
	"path",
	"updated_at",
];

// ----- queries -----------------------
// const queries = {

// };
