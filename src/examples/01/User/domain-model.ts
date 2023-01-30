import { PG } from "../../../index.js";

import { Model, Types } from "./model.js";

export class UserDM
	extends PG.BaseDomain<
		Model,
		Types.CreateFields,
		Types.SearchFields,
		Types.TableFields,
		Types.UpdateFields
	> {
	constructor(creds: PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}
}
