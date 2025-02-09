import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { PG } from "../index.js";

import * as Helpers from "../helpers.js";

import * as TestTable from "./test-table-01/index.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: PG.ModelTypes.TDBCreds): Promise<void> => {
	const testTable = new TestTable.Domain(creds);

	await test("PG-" + TEST_NAME, async (testContext) => {
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
							const entity = await testTable.createOne(initialParams, { returningFields: ["title"] });

							assert.strictEqual(entity.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one } = await testTable.getOneByParams({ params: initialParams });

							assert.strictEqual(one?.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"update updateByParams",
						async () => {
							const [result] = await testTable.updateByParams({
								params: initialParams,
								returningFields: ["title"],
							}, updatedParams);

							assert.strictEqual(result?.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one: entity } = await testTable.getOneByParams({ params: updatedParams });

							assert.strictEqual(entity?.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"delete deleteByParams",
						async () => {
							await testTable.deleteByParams({ params: updatedParams });

							const res = await testTable.getArrByParams({ params: {} });

							assert.strictEqual(res.length, 0);
						},
					);
				}

				await testTable.deleteAll();
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
