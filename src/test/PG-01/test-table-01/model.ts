import { PG } from "../../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"books",
			"description",
			"checklist",
			"meta",
			"number_key",
			"number_range",
			"title",

			"created_at",
			"updated_at",
		] as const,
		tableName: "test_table_01",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	creds,
);
