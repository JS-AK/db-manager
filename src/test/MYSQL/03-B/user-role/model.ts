import { MYSQL } from "../../index.js";

export const model = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.Model.BaseTable(
	{
		createField: { title: "created_at", type: "unix_timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"title",

			"created_at",
			"updated_at",
		],
		tableName: "user_roles",
		updateField: { title: "updated_at", type: "unix_timestamp" },
	},
	creds,
);
