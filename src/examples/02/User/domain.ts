import { MYSQL } from "../../../index.js";

import { Model, Types } from "./model/index.js";

export class Domain extends MYSQL.BaseDomain<{
	Model: Model;
	CreateFields: Types.CreateFields;
	SearchFields: Types.SearchFields;
	TableFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {

	constructor(creds: MYSQL.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}
}
