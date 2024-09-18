import { MYSQL } from "../../mysql.js";

export const model = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.Model.BaseTable(
	{
		createField: { title: "created_at", type: "unix_timestamp" },
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
		] as const,
		tableName: "users",
		updateField: { title: "updated_at", type: "unix_timestamp" },
	},
	creds,
);
