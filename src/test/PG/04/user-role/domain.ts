import { PG } from "../../index.js";

import { Model, Types } from "./model/index.js";

export class Domain extends PG.BaseDomain<{
	Model: Model;
	CreateFields: Types.CreateFields;
	SearchFields: Types.SearchFields;
	TableFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {

	constructor(creds: PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}
}
