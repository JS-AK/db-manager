import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { MYSQL } from "../index.js";

import * as Helpers from "../helpers.js";

import * as TestTable01 from "./test-table-01/index.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: MYSQL.ModelTypes.TDBCreds) => {
	const testTable01 = TestTable01.domain(creds);

	return test("MYSQL-" + TEST_NAME, async (testContext) => {
		await testContext.test(
			"Helpers.migrationsUp",
			async () => { await Helpers.migrationsUp(creds, TEST_NAME); },
		);

		await testContext.test(
			"CRUD",
			async (testContext) => {
				const initialParams = { title: "title" };
				const updatedParams = { title: "title updated" };

				{
					await testContext.test(
						"create createOne",
						async () => {
							await testTable01.createOne(initialParams);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one } = await testTable01.getOneByParams({ params: initialParams });

							assert.strictEqual(one?.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"update updateByParams",
						async () => {
							await testTable01.updateByParams({ params: initialParams }, updatedParams);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one: entity } = await testTable01.getOneByParams({ params: updatedParams });

							assert.strictEqual(entity?.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"delete deleteByParams",
						async () => {
							await testTable01.deleteByParams({ params: updatedParams });

							const res = await testTable01.getArrByParams({ params: {} });

							assert.strictEqual(res.length, 0);
						},
					);
				}

				await testTable01.deleteAll();
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
