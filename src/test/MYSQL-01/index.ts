import assert from "node:assert";
import test from "node:test";

import { MYSQL } from "../../index.js";
import { TestTable } from "./testTable/domain.js";

const creds = {
	database: "test-base",
	host: process.env.MYSQL_HOST || "localhost",
	password: "test-password",
	port: parseInt(process.env.MYSQL_PORT || "", 10) || 3306,
	user: "test-user",
};

const testTable = new TestTable(creds);

test("top level test", async (t) => {
	await t.test("createTable", async () => {
		const pool = MYSQL.BaseModel.getStandartPool(creds);

		await pool.promise().query("DROP TABLE IF EXISTS test_table;");

		await pool.promise().query(`
			CREATE TABLE test_table(
			  id                              INT NOT NULL AUTO_INCREMENT,

			  title                           varchar(255) NOT NULL,

			  created_at                      DATETIME DEFAULT CURRENT_TIMESTAMP,
			  updated_at                      DATETIME,
			  PRIMARY KEY (id)
			);
		`);
	});

	await t.test("createOne", async () => {
		const title1 = "test 1";
		const title2 = "test 2";

		const example1Id = await testTable.createOne({ title: title1 });

		assert.equal(example1Id, 1);

		const example2Id = await testTable.createOne({ title: title2 });

		assert.equal(example2Id, 2);
	});

	await t.test("getGuaranteedOneByParams", async () => {
		const title = "test 1";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { title },
		});

		assert.equal(!!exampleFound.id, true);
		assert.equal(!!exampleFound.created_at, true);
		assert.equal(!!exampleFound.updated_at, false);
		assert.equal(exampleFound.title, title);
	});

	await t.test("updateOneByPk", async () => {
		const title = "test 1";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { title },
		});

		const titleUpdated = "test 1 updated";

		await testTable.updateOneByPk(
			exampleFound.id,
			{ title: titleUpdated },
		);

		const exampleUpdatedFound = await testTable.getGuaranteedOneByParams({
			params: { title: titleUpdated },
		});

		assert.equal(!!exampleUpdatedFound.id, true);
		assert.equal(!!exampleUpdatedFound.created_at, true);
		assert.equal(!!exampleUpdatedFound.updated_at, true);
		assert.equal(exampleUpdatedFound.title, titleUpdated);
	});

	await t.test("deleteOneByPk", async () => {
		const title = "test 1 updated";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { title },
		});

		await testTable.deleteOneByPk(exampleFound.id);

		const exampleUpdatedFound = await testTable.getGuaranteedOneByParams({
			params: { id: exampleFound.id },
		});

		assert.equal(!!exampleUpdatedFound, false);
	});

	await t.test("deleteAll", async () => {
		await testTable.deleteAll();

		const rowsCount = await testTable.getCountByParams({
			params: {},
		});

		assert.equal(rowsCount, 0);
	});

	await t.test("custom function test()", async () => {
		const isNotTestFailed = await testTable.test();

		assert.equal(isNotTestFailed, true);
	});

	await t.test("dropTable", async () => {
		const pool = MYSQL.BaseModel.getStandartPool(creds);

		await pool.promise().query("DROP TABLE IF EXISTS test_table;");

		pool.end();
	});
});
