import { PG } from "../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";
import { queries } from "./queries.js";

class Domain extends PG.Domain.BaseTable<ReturnType<typeof model>, {
	CoreFields: Types.TableFields;
}> {
	async test(): Promise<boolean> {
		const { rows: [entity] } = await this
			.model
			.pool
			.query<{ test: boolean; }>(queries.test());

		if (!entity) return false;

		return entity.test;
	}

}

export const domain = (creds: PG.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
