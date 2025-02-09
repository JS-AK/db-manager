// ----- Dependencies --------------------------
import { PG } from "../../../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"is_folder",
			"name",
			"path",

			"created_at",
			"updated_at",
		],
		tableName: "file_system",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
