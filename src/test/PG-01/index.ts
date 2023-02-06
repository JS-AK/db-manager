import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";
import { TestTable1 } from "./testTable1/domain.js";
import { TestTable2 } from "./testTable2/domain.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

const testTable1 = new TestTable1(creds);
const testTable2 = new TestTable2(creds);

test("top level test", async (t) => {
	await t.test("createTables", async () => {
		const pool = PG.BaseModel.getStandartPool(creds);

		await pool.query(`
			DROP TABLE IF EXISTS test_table;

			CREATE TABLE test_table_1(
			  id                              BIGSERIAL PRIMARY KEY,

			  description                     TEXT,
			  meta                            JSONB NOT NULL,
			  title                           TEXT NOT NULL,

			  created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			  updated_at                      TIMESTAMP WITH TIME ZONE
			);
		`);

		await pool.query(`
			DROP TABLE IF EXISTS test_table;

			CREATE TABLE test_table_2(
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
		const meta = { firstname: "test", lastname: "test" };
		const title = "test 1";

		const example1 = await testTable1.createOne({ meta, title });

		assert.equal(!!example1.id, true);
		assert.equal(!!example1.created_at, true);
		assert.equal(!!example1.updated_at, false);
		assert.equal(example1.title, title);
		assert.equal(example1.meta.firstname, meta.firstname);
		assert.equal(example1.meta.lastname, meta.lastname);

		await testTable1.createOne({ description: "test", meta, title: "test 2" });
		await testTable1.createOne({ meta, title: "test 3" });
		await testTable1.createOne({ meta, title: "test 4" });
		await testTable1.createOne({ meta, title: "test 5" });
	});

	await t.test("transaction 1st", async () => {
		const transactionPool = PG.BaseModel.getTransactionPool(creds);
		const client = await transactionPool.connect();

		try {
			await client.query("BEGIN");
			const title = "title transaction 1";

			const { query, values } = PG.BaseModel.getInsertFields(
				{
					meta: { firstname: "test", lastname: "test" },
					title,
				},
				"test_table_2",
				["id", "title"],
			);

			const data = (await client.query(query, values)).rows[0];

			assert.equal(data.title, title);

			await client.query(`
				DELETE
				FROM test_table_2
				WHERE id = $1
			`, [data.id]);

			const { one } = await testTable2.getOneByPk(data.id);

			assert.equal(one, undefined);

			await client.query("COMMIT");
		} catch (e) {
			await client.query("ROLLBACK");
			throw e;
		} finally {
			client.release();
		}
	});

	await t.test("transaction 2nd", async () => {
		const transactionPool = PG.BaseModel.getTransactionPool(creds);
		const client = await transactionPool.connect();

		try {
			await client.query("BEGIN");
			const title = "title transaction 2";

			const { query, values } = PG.BaseModel.getInsertFields(
				{
					meta: { firstname: "test", lastname: "test" },
					title,
				},
				"test_table_2",
				["id", "title"],
			);

			const data = (await client.query(query, values)).rows[0];

			assert.equal(data.title, title);

			await client.query("COMMIT");
		} catch (e) {
			await client.query("ROLLBACK");
			throw e;
		} finally {
			client.release();
		}
	});

	await t.test("getArrByParams", async () => {
		const res = await testTable1.getArrByParams({
			params: {},
		});

		assert.equal(res.length, 5);
	});

	await t.test("getArrByParams with ordering", async () => {
		{
			const res = await testTable1.getArrByParams({
				orderBy: "title",
				ordering: "DESC",
				params: {},
			});

			assert.equal(res[0]?.title, "test 5");
		}
		{
			const res = await testTable1.getArrByParams({
				orderBy: "title",
				ordering: "ASC",
				params: {},
			});

			assert.equal(res[0]?.title, "test 1");
		}
	});

	await t.test("getArrByParams with params: {title: 'test 1'}", async () => {
		const res = await testTable1.getArrByParams({
			params: { title: "test 1" },
		});

		assert.equal(res.length, 1);
	});

	await t.test("getArrByParams description: null", async () => {
		const res = await testTable1.getArrByParams({
			params: { description: null },
		});

		assert.equal(res.length, 4);
	});

	await t.test("getGuaranteedOneByParams", async () => {
		const title = "title transaction 2";
		const meta = { firstname: "test", lastname: "test" };

		const exampleFound = await testTable2.getGuaranteedOneByParams({
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
		const titleOrigin = "test 1";
		const title = "%est 1%";

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { title: { $like: title } },
		});

		assert.equal(exampleFound.title, titleOrigin);
	});

	await t.test("getGuaranteedOneByParams with $ne", async () => {
		const titleOrigin = "test 2";

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { description: { $ne: null } },
		});

		assert.equal(exampleFound.title, titleOrigin);
	});

	await t.test("updateOneByPk", async () => {
		const meta = { firstname: "test", lastname: "test" };
		const title = "test 1";

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { meta, title },
		});

		const titleUpdated = "test updated";
		const metaUpdated = {
			firstname: "test updated",
			lastname: "test updated",
		};

		const exampleUpdated = await testTable1.updateOneByPk(
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

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { title },
		});

		const exampleDeletedId = await testTable1.deleteOneByPk(exampleFound.id);

		assert.equal(exampleFound.id, exampleDeletedId);
	});

	await t.test("deleteAll", async () => {
		await testTable1.deleteAll();

		const allDataAfterDeleted = await testTable1.getArrByParams({
			params: {},
		});

		assert.equal(allDataAfterDeleted.length, 0);
	});

	await t.test("custom function test()", async () => {
		const isNotTestFailed = await testTable1.test();

		assert.equal(isNotTestFailed, true);
	});

	await t.test("dropTables", async () => {
		const pool = PG.BaseModel.getStandartPool(creds);
		const transactionPool = PG.BaseModel.getTransactionPool(creds);

		await pool.query("DROP TABLE IF EXISTS test_table_1;");
		await pool.query("DROP TABLE IF EXISTS test_table_2;");

		pool.end();
		transactionPool.end();
	});
});
