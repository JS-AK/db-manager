import { PG } from "../../../../../../index.js";

import * as Types from "./types.js";

export const domain = (dbCreds: PG.ModelTypes.TDBCreds) => {
	return new PG.Repository.Table<{ CoreFields: Types.TableFields; }>({
		dbCreds,
		schema: {
			tableName: "invTypes",

			primaryKey: "\"typeID\"",

			tableFields: [
				"\"typeID\"",
				"\"groupID\"",
				"\"typeName\"",
				"published",
			],

			createField: null,
			updateField: null,
		},
	});
};
