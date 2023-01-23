import { MYSQL } from "../../../index.js";

import { Model, Types } from "./model/index.js";

export class TestTable
	extends MYSQL.BaseDomain<
		Model,
		Types.CreateFields,
		Types.SearchFields,
		Types.TableFields,
		Types.UpdateFields
	> {
	constructor(creds: MYSQL.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}

	async test(): Promise<boolean> {
		const res = await this.model.test();

		return !!res.test;
	}
}
