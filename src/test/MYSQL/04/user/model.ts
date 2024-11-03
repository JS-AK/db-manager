import { MYSQL } from "../../index.js";

export const model = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"id_user_role",

			"first_name",
			"last_name",

			"deleted_at",
			"is_deleted",

			"created_at",
			"updated_at",
		],
		tableName: "users",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
