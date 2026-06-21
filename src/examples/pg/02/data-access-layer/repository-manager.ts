import { PG } from "../../../../index.js";

import * as Repository from "./repository/index.js";

export const create = (creds: PG.ModelTypes.TDBCreds) => new PG.RepositoryManager(
	{
		invType: Repository.InvType.domain(creds),
	},
	{ config: creds, isLoggerEnabled: false, logger: console },
);
