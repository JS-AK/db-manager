import { MYSQL } from "../../../../index.js";

export const model = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		isPKAutoIncremented: false,
		primaryKey: ["id", "id_sec"],
		tableFields: [
			"id",
			"id_sec",

			"first_name",
			"last_name",
			"rating",
			"score",

			"created_at",
			"updated_at",
		],
		tableName: "test_users",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
