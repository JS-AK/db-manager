import { MYSQL } from "../../index.js";

export const model = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.Model.BaseTable(
	{
		createField: null,
		isPKAutoIncremented: false,
		primaryKey: null,
		tableFields: ["title"] as const,
		tableName: "test_table_01",
		updateField: null,
	},
	creds,
);
