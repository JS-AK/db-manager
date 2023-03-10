import { PG } from "../../../index.js";

import { Model, Types } from "./model/index.js";

export class TestTable2 extends PG.BaseDomain<
	Model,
	Types.CreateFields,
	Types.SearchFields,
	Types.TableFields,
	Types.UpdateFields
> {

	constructor(creds: PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}

	async test(): Promise<boolean> {
		const res = await this.model.test();

		return !!res.test;
	}
}
