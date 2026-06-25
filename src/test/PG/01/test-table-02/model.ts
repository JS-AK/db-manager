import { PG } from "../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "unix_timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"description",
			"title",

			"created_at",
			"updated_at",
		],
		tableName: "test_table_02",
		updateField: { title: "updated_at", type: "unix_timestamp" },
	},
	creds,
);
