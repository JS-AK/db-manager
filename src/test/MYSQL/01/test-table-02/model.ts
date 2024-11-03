import { MYSQL } from "../../index.js";

export const model = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.Model.BaseTable(
	{
		createField: { title: "created_at", type: "unix_timestamp" },
		primaryKey: "id",
		tableFields: [
			"id", // -> id

			"title", // -> title

			"created_at", // -> create date
			"updated_at", // -> update date
		],
		tableName: "test_table_02",
		updateField: { title: "updated_at", type: "unix_timestamp" },
	},
	creds,
);
