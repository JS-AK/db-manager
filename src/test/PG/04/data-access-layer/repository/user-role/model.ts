import { PG } from "../../../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"title",

			"created_at",
			"updated_at",
		],
		tableName: "user_roles",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
