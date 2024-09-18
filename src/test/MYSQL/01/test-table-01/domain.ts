import { MYSQL } from "../../../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";
import { queries } from "./queries.js";

class Domain extends MYSQL.Domain.BaseTable<ReturnType<typeof model>, {
	CoreFields: Types.TableFields;
}> {
	async test(): Promise<boolean> {
		const [[entity]] = await this
			.model
			.executeSql<MYSQL.ModelTypes.RowDataPacket & { test: number; }>({ query: queries.test() });

		return Boolean(entity?.test);
	}

}

export const domain = (creds: MYSQL.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
