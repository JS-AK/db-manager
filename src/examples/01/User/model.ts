// ----- Dependiences ----------------------------
import { PG } from "../../../index.js";
import { TableKeys } from "./types.js";

// ----- Reexport types ------------------------
export * as Types from "./types.js";

// ----- Сам класс ------------------------------
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
}

// ----- Table propertires ----------------------
const tableName = "users"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = "created_at"; // created field
const updateField = "updated_at"; // updated field
const tableFields: TableKeys[] = [
	"created_at", // -> create date
	"id", // -> id
	"firstname", // -> firstname
	"lastname", // -> lastname
	"updated_at", // -> update date
];

// ----- queries -----------------------
// const queries = {
// };
