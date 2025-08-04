import { MYSQL } from "../../../../../../index.js";

import * as Types from "./types.js";

export const domain = (dbCreds: MYSQL.ModelTypes.TDBCreds) => {
	return new MYSQL.Repository.Table<{ CoreFields: Types.TableFields; }>({
		dbCreds,
		schema: {
			tableName: "users",

			primaryKey: "id",

			tableFields: [
				"id",

				"first_name",
				"last_name",

				"created_at",
				"updated_at",
			],

			createField: { title: "created_at", type: "timestamp" },
			updateField: { title: "updated_at", type: "timestamp" },
		},
	});
};
