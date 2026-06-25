import { PG } from "../../index.js";

export const model = (creds: PG.ModelTypes.TDBCreds) => new PG.Model.BaseTable(
	{
		createField: null,
		primaryKey: null,
		tableFields: ["title"],
		tableName: "test_table_01",
		updateField: null,
	},
	creds,
);
