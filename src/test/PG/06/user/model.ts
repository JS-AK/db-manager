import { PG } from "../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"firstName",
			"lastName",

			"created_at",
			"updated_at",
		] as const,
		tableName: "users",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
