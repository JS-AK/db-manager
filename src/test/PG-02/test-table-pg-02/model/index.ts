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
}

// ----- Table propertires ----------------------
const tableName = "test_table_pg_02"; // table from DB
const primaryKey = null; // primaryId from table
const createField = null; // created field
const updateField = null; // updated field
const tableFields: TableKeys[] = [
	"title", // -> title
];

// ----- queries -----------------------
// const queries = {

// };
