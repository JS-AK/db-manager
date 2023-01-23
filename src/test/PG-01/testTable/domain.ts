import { PG } from "../../../index.js";

import { Model, Types } from "./model/index.js";

export class TestTable
	extends PG.BaseDomain<Types.CreateFields, Types.SearchFields, Types.TableFields, Types.UpdateFields> {
	constructor(creds: PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}
}
