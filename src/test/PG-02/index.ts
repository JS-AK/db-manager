import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as TestTable from "./test-table-01/index.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

export default async () => {
	const testTable = new TestTable.Domain(creds);

	return test("PG-02", async (testContext) => {
		await testContext.test(
			"create table",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${testTable.tableName};

					CREATE TABLE ${testTable.tableName}(
					  title                           TEXT UNIQUE NOT NULL
					);
				`);
			},
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
							const entity = await testTable.createOne(initialParams, ["title"]);

							assert.equal(entity.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one } = await testTable.getOneByParams({ params: initialParams });

							assert.equal(one?.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"update updateByParams",
						async () => {
							const res = await testTable.updateByParams({ params: initialParams }, updatedParams);

							assert.equal(res[0]?.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one: entity } = await testTable.getOneByParams({ params: updatedParams });

							assert.equal(entity?.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"delete deleteByParams",
						async () => {
							await testTable.deleteByParams({ params: updatedParams });

							const res = await testTable.getArrByParams({ params: {} });

							assert.equal(res.length, 0);
						},
					);
				}

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"dropTable",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${testTable.tableName};`);
			},
		);

		await testContext.test(
			"remove pools",
			async () => {
				await PG.BaseModel.removeStandardPool(creds);
				await PG.BaseModel.removeTransactionPool(creds);
			},
		);
	});
};
