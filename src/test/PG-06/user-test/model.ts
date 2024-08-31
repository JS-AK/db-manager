import { PG } from "../../../index.js";

const tableFields = [
	"id",
	"id_sec",

	"first_name",
	"last_name",

	"created_at",
	"updated_at",
] as const;

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: ["id", "id_sec"],
		tableFields,
		tableName: "users_test",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
