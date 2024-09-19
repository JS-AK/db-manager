import { PG } from "../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "unix_timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"id_user_role",

			"first_name",
			"is_deleted",
			"last_name",

			"created_at",
			"updated_at",
		] as const,
		tableName: "users",
		updateField: { title: "updated_at", type: "unix_timestamp" },
	},
	creds,
);
