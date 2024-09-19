import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { PG } from "../index.js";

import * as Helpers from "../helpers.js";

import * as FileSystemTable from "./file-system/index.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: PG.ModelTypes.TDBCreds) => {
	const FileSystem = new FileSystemTable.Domain(creds);

	return test("PG-" + TEST_NAME, async (testContext) => {
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
							await FileSystem.createOne({ is_folder: true, name: "root", path: "root" });
							await FileSystem.createOne({ is_folder: true, name: "etc", path: "root.etc" });
							await FileSystem.createOne({ is_folder: true, name: "passwd", path: "root.etc.passwd" });
							await FileSystem.createOne({ is_folder: true, name: "home", path: "root.home" });
							await FileSystem.createOne({ is_folder: true, name: "user", path: "root.home.user" });
							await FileSystem.createOne({ is_folder: true, name: "documents", path: "root.home.user.documents" });
						},
					);

					{
						await testContext.test(
							"getAll",
							async () => {
								const fileSystem = await FileSystem.getAll();

								assert.strictEqual(fileSystem.length, 6);
							},
						);
					}

					{
						await testContext.test(
							"getAllWithLevel",
							async () => {
								const fileSystem = await FileSystem.getAllWithLevel();

								assert.strictEqual(fileSystem.length, 6);
							},
						);
					}

					{
						await testContext.test(
							"getAllInsideHomePath",
							async () => {
								const fileSystem = await FileSystem.getAllInsideHomePath();

								assert.strictEqual(fileSystem.length, 3);
							},
						);
					}

					{
						await testContext.test(
							"getAllOutsideHomePath",
							async () => {
								const fileSystem = await FileSystem.getAllOutsideHomePath();

								assert.strictEqual(fileSystem.length, 2);
							},
						);
					}

					await FileSystem.deleteAll();
				}
			},
		);

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
