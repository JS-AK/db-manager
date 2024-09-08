import { PG } from "../../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";

class Domain extends PG.Domain.BaseTable<ReturnType<typeof model>, {
	CoreFields: Types.TableFields;
}> { }

export const domain = (creds: PG.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
