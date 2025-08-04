import { MYSQL } from "../../../../index.js";

import * as Repository from "./repository/index.js";

export const create = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.RepositoryManager(
	{
		user: Repository.User.domain(creds),
	},
	{ config: creds, isLoggerEnabled: false, logger: console },
);
