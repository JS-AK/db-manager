import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";
import { TestTable } from "./testTable/domain.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

const testTable = new TestTable(creds);

test("top level test", async (t) => {
	await t.test("createTable", async () => {
		const pool = PG.BaseModel.getStandartPool(creds);

		await pool.query(`
			DROP TABLE IF EXISTS test_table;

			CREATE TABLE test_table(
			  id                              BIGSERIAL PRIMARY KEY,

			  description                     TEXT,
			  meta                            JSONB NOT NULL,
			  title                           TEXT NOT NULL,

			  created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			  updated_at                      TIMESTAMP WITH TIME ZONE
			);
		`);
	});

	await t.test("createOne", async () => {
		const description = "test";
		const meta = { firstname: "test", lastname: "test" };
		const title = "test";

		const example = await testTable.createOne({ description, meta, title });

		assert.equal(!!example.id, true);
		assert.equal(!!example.created_at, true);
		assert.equal(!!example.updated_at, false);
		assert.equal(example.title, title);
		assert.equal(example.meta.firstname, meta.firstname);
		assert.equal(example.meta.lastname, meta.lastname);
	});

	await t.test("getGuaranteedOneByParams", async () => {
		const title = "test";
		const meta = { firstname: "test", lastname: "test" };

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { meta, title },
		});

		assert.equal(!!exampleFound.id, true);
		assert.equal(!!exampleFound.created_at, true);
		assert.equal(!!exampleFound.updated_at, false);
		assert.equal(exampleFound.title, title);
		assert.equal(exampleFound.meta.firstname, meta.firstname);
		assert.equal(exampleFound.meta.lastname, meta.lastname);
	});

	await t.test("getGuaranteedOneByParams with $like", async () => {
		const titleOrigin = "test";
		const title = "%tes%";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { title: { $like: title } },
		});

		assert.equal(exampleFound.title, titleOrigin);
	});

	await t.test("getGuaranteedOneByParams with $ne", async () => {
		const titleOrigin = "test";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { description: { $ne: null } },
		});

		assert.equal(exampleFound.title, titleOrigin);
	});

	await t.test("updateOneByPk", async () => {
		const meta = { firstname: "test", lastname: "test" };
		const title = "test";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { meta, title },
		});

		const titleUpdated = "test updated";
		const metaUpdated = {
			firstname: "test updated",
			lastname: "test updated",
		};

		const exampleUpdated = await testTable.updateOneByPk(
			exampleFound.id,
			{
				meta: metaUpdated,
				title: titleUpdated,
			},
		);

		assert.equal(!!exampleUpdated.id, true);
		assert.equal(!!exampleUpdated.created_at, true);
		assert.equal(!!exampleUpdated.updated_at, true);
		assert.equal(exampleUpdated.title, titleUpdated);
		assert.equal(exampleUpdated.meta.firstname, metaUpdated.firstname);
		assert.equal(exampleUpdated.meta.lastname, metaUpdated.lastname);
	});

	await t.test("deleteOneByPk", async () => {
		const title = "test updated";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { title },
		});

		const exampleDeletedId = await testTable.deleteOneByPk(exampleFound.id);

		assert.equal(exampleFound.id, exampleDeletedId);
	});

	await t.test("deleteAll", async () => {
		await testTable.deleteAll();

		const allDataAfterDeleted = await testTable.getArrByParams({
			params: {},
		});

		assert.equal(allDataAfterDeleted.length, 0);
	});

	await t.test("custom function test()", async () => {
		const isNotTestFailed = await testTable.test();

		assert.equal(isNotTestFailed, true);
	});

	await t.test("dropTable", async () => {
		const pool = PG.BaseModel.getStandartPool(creds);

		await pool.query("DROP TABLE IF EXISTS test_table;");

		pool.end();
	});
});
