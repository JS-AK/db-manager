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

			  title                           TEXT NOT NULL,
			  meta                            JSONB NOT NULL,

			  created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			  updated_at                      TIMESTAMP WITH TIME ZONE
			);
		`);
	});

	await t.test("createOne", async () => {
		const title = "test";
		const firstname = "test";
		const lastname = "test";

		const example = await testTable.createOne({
			meta: { firstname, lastname },
			title,
		});

		assert.equal(!!example.id, true);
		assert.equal(!!example.created_at, true);
		assert.equal(!!example.updated_at, false);
		assert.equal(example.title, title);
		assert.equal(example.meta.firstname, firstname);
		assert.equal(example.meta.lastname, lastname);
	});

	await t.test("getGuaranteedOneByParams", async () => {
		const title = "test";
		const firstname = "test";
		const lastname = "test";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: {
				meta: { firstname, lastname },
				title,
			},
		});

		assert.equal(!!exampleFound.id, true);
		assert.equal(!!exampleFound.created_at, true);
		assert.equal(!!exampleFound.updated_at, false);
		assert.equal(exampleFound.title, title);
		assert.equal(exampleFound.meta.firstname, firstname);
		assert.equal(exampleFound.meta.lastname, lastname);
	});

	await t.test("updateOneByPk", async () => {
		const title = "test";
		const firstname = "test";
		const lastname = "test";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: {
				meta: { firstname, lastname },
				title,
			},
		});

		const titleUpdated = "test updated";
		const firstnameUpdated = "test updated";
		const lastnameUpdated = "test updated";

		const exampleUpdated = await testTable.updateOneByPk(
			exampleFound.id,
			{
				meta: {
					firstname: firstnameUpdated,
					lastname: lastnameUpdated,
				},
				title: titleUpdated,
			},
		);

		assert.equal(!!exampleUpdated.id, true);
		assert.equal(!!exampleUpdated.created_at, true);
		assert.equal(!!exampleUpdated.updated_at, true);
		assert.equal(exampleUpdated.title, titleUpdated);
		assert.equal(exampleUpdated.meta.firstname, firstnameUpdated);
		assert.equal(exampleUpdated.meta.lastname, lastnameUpdated);
	});

	await t.test("deleteAll", async () => {
		const allData = await testTable.getArrByParams({
			params: {},
		});

		const deletedData = await testTable.deleteAll();

		assert.equal(
			JSON.stringify(allData.map((e) => e.id)),
			JSON.stringify(deletedData),
		);
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
