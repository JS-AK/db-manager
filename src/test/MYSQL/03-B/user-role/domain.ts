import { MYSQL } from "../../mysql.js";

import * as Types from "./types.js";

import { model } from "./model.js";

class Domain extends MYSQL.Domain.BaseTable<ReturnType<typeof model>, {
	CoreFields: Types.TableFields;
}> { }

export const domain = (creds: MYSQL.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
