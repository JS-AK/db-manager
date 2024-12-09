import { MYSQL } from "../../../../index.js";

import * as Repository from "./repository/index.js";

export class RepositoryManager {
	#repositoryManager;

	repository;

	constructor(creds: MYSQL.ModelTypes.TDBCreds) {
		this.#repositoryManager = new MYSQL.RepositoryManager(
			{
				user: Repository.User.domain(creds),
				userRole: Repository.UserRole.domain(creds),
			},
			{ config: creds, isLoggerEnabled: false, logger: console },
		);

		this.repository = this.#repositoryManager.repository;
	}

	async init() {
		await this.#repositoryManager.init();
	}

	async shutdown() {
		await this.#repositoryManager.shutdown();
	}
}