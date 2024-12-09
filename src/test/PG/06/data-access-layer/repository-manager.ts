import { PG } from "../../../../index.js";

import * as Repository from "./repository/index.js";

export class RepositoryManager {
	#repositoryManager;

	repository;

	constructor(creds: PG.ModelTypes.TDBCreds) {
		this.#repositoryManager = new PG.RepositoryManager(
			{
				admin: Repository.Admin.domain(creds),
				testUser: Repository.TestUser.domain(creds),
				user: Repository.User.domain(creds),
			},
			{ config: creds, isLoggerEnabled: false, logger: console },
		);

		this.repository = this.#repositoryManager.repository;
	}

	async init() {
		await this.#repositoryManager.init();
	}
}
