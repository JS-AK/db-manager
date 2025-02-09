import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { PG } from "../index.js";

import * as Helpers from "../helpers.js";

import { RepositoryManager } from "./data-access-layer/repository-manager.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: PG.ModelTypes.TDBCreds): Promise<void> => {
	await test("PG-" + TEST_NAME, async (testContext) => {
		const repositoryManager = new RepositoryManager(creds);

		await repositoryManager.init();

		const fileSystemRepository = repositoryManager.repository.fileSystem;

		await testContext.test(
			"Helpers.migrationsUp",
			async () => { await Helpers.migrationsUp(creds, TEST_NAME); },
		);

		await testContext.test(
			"queryBuilder",
			async (testContext) => {
				{
					await testContext.test(
						"create data",
						async () => {
							await fileSystemRepository.createOne({ is_folder: true, name: "root", path: "root" });
							await fileSystemRepository.createOne({ is_folder: true, name: "etc", path: "root.etc" });
							await fileSystemRepository.createOne({ is_folder: true, name: "passwd", path: "root.etc.passwd" });
							await fileSystemRepository.createOne({ is_folder: true, name: "home", path: "root.home" });
							await fileSystemRepository.createOne({ is_folder: true, name: "user", path: "root.home.user" });
							await fileSystemRepository.createOne({ is_folder: true, name: "documents", path: "root.home.user.documents" });
						},
					);

					{
						await testContext.test(
							"getAll",
							async () => {
								const fileSystem = await fileSystemRepository.getAll();

								assert.strictEqual(fileSystem.length, 6);
							},
						);
					}

					{
						await testContext.test(
							"getAllWithLevel",
							async () => {
								const fileSystem = await fileSystemRepository.getAllWithLevel();

								assert.strictEqual(fileSystem.length, 6);
							},
						);
					}

					{
						await testContext.test(
							"getAllInsideHomePath",
							async () => {
								const fileSystem = await fileSystemRepository.getAllInsideHomePath();

								assert.strictEqual(fileSystem.length, 3);
							},
						);
					}

					{
						await testContext.test(
							"getAllOutsideHomePath",
							async () => {
								const fileSystem = await fileSystemRepository.getAllOutsideHomePath();

								assert.strictEqual(fileSystem.length, 2);
							},
						);
					}

					await fileSystemRepository.deleteAll();
				}
			},
		);

		await repositoryManager.shutdown();

		await testContext.test(
			"Helpers.migrationsDown",
			async () => { await Helpers.migrationsDown(creds, TEST_NAME); },
		);

		await testContext.test(
			"Helpers.connectionShutdown",
			async () => { await Helpers.connectionShutdown(); },
		);
	});
};
