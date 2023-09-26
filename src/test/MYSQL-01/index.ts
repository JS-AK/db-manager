import assert from "node:assert";
import test from "node:test";

import { MYSQL } from "../../index.js";

import * as TestTable1 from "./test-table-1/index.js";
import * as TestTable2 from "./test-table-2/index.js";

const creds = {
	database: "test-base",
	host: process.env.MYSQL_HOST || "localhost",
	password: "test-password",
	port: parseInt(process.env.MYSQL_PORT || "", 10) || 3306,
	user: "test-user",
};

const testTable1 = new TestTable1.Domain(creds);
const testTable2 = new TestTable2.Domain(creds);

test("top level test MYSQL", async (t) => {
	await t.test("createTable", async () => {
		const pool = MYSQL.BaseModel.getStandardPool(creds);

		await pool.query(`DROP TABLE IF EXISTS ${testTable1.tableName};`);
		await pool.query(`
			CREATE TABLE ${testTable1.tableName}(
			  id                              INT NOT NULL AUTO_INCREMENT,

			  description                     varchar(255),
			  title                           varchar(255) NOT NULL,

			  created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
			  updated_at                      DATETIME,
			  PRIMARY KEY (id)
			);
		`);

		await pool.query(`DROP TABLE IF EXISTS ${testTable2.tableName};`);
		await pool.query(`
			CREATE TABLE ${testTable2.tableName}(
			  id                              INT NOT NULL AUTO_INCREMENT,

			  description                     varchar(255),
			  title                           varchar(255) NOT NULL,

			  created_at                      BIGINT DEFAULT (ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)),
			  updated_at                      BIGINT,
			  PRIMARY KEY (id)
			);
		`);
	});

	await t.test("createOne", async () => {
		const example1Id = await testTable1.createOne({ title: "test 1" });
		const example2Id = await testTable1.createOne({ title: "test 2" });
		const example3Id = await testTable1.createOne({ description: "test 3", title: "test 3" });
		const example4Id = await testTable1.createOne({ title: "test 4" });
		const example5Id = await testTable1.createOne({ title: "test 5" });

		assert.equal(example1Id, 1);
		assert.equal(example2Id, 2);
		assert.equal(example3Id, 3);
		assert.equal(example4Id, 4);
		assert.equal(example5Id, 5);
	});

	await t.test("CRUD table 2", async () => {
		const example1Id = await testTable2.createOne({ title: "title" });

		assert.equal(typeof example1Id, "number");

		const example1 = await testTable2.getGuaranteedOneByParams({
			params: { id: example1Id.toString() },
		});

		assert.equal(typeof example1.created_at, "number");
		assert.equal(example1.description, null);
		assert.equal(typeof example1.id, "number");
		assert.equal(example1.title, "title");
		assert.equal(example1.updated_at, null);

		await testTable2.updateOneByPk(example1Id, {
			description: "description",
			title: "title updated",
		});

		const example1Updated = await testTable2.getGuaranteedOneByParams({
			params: { id: example1Id.toString() },
		});

		assert.equal(typeof example1Updated.created_at, "number");
		assert.equal(example1Updated.description, "description");
		assert.equal(typeof example1Updated.id, "number");
		assert.equal(example1Updated.title, "title updated");
		assert.equal(typeof example1Updated.updated_at, "number");

		await testTable2.deleteOneByPk(example1Id);

		const example1Deleted = await testTable2.getGuaranteedOneByParams({
			params: { id: example1Id.toString() },
		});

		assert.equal(example1Deleted, undefined);
	});

	await t.test("transaction 1", async () => {
		const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);
		const connection = await transactionPool.getConnection();

		try {
			await connection.beginTransaction();

			await connection.query(`
				DELETE
				FROM ${testTable1.tableName}
				WHERE title = ?
			`, ["test 5"]);

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	});

	await t.test("transaction 2", async () => {
		const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);
		const connection = await transactionPool.getConnection();

		try {
			await connection.beginTransaction();

			await connection.query(`
				DELETE
				FROM ${testTable1.tableName}
				WHERE title = ?
			`, ["test 4"]);

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	});

	await t.test("transaction 3", async () => {
		const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);
		const connection = await transactionPool.getConnection();

		try {
			await connection.beginTransaction();

			let id = "";

			{
				const description = "description transaction 1";
				const title = "title transaction 1";

				const { query, values } = MYSQL
					.BaseModel
					.getInsertFields<TestTable1.Types.CreateFields>({
						params: { description, title },
						tableName: testTable1.tableName,
					});

				const [inserted] = (await connection.query<MYSQL.ModelTypes.ResultSetHeader>(query, values));

				const [entities] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable1.Types.TableFields)[]>(`
					SELECT *
					FROM ${testTable1.tableName}
					WHERE id = ?
				`, [inserted?.insertId]));

				assert.equal(entities[0]?.title, title);
				assert.equal(entities[0]?.description, description);

				id = entities[0]?.id as string;
			}

			{
				const description = "description transaction 1 updated";
				const title = "title transaction 1 updated";

				const { query, values } = MYSQL
					.BaseModel
					.getUpdateFields<TestTable1.Types.UpdateFields, TestTable1.Types.TableKeys>({
						params: { description, title },
						primaryKey: { field: "id", value: id },
						tableName: testTable1.tableName,
						updateField: testTable1.updateField,
					});

				await connection.query(query, values);

				const [entities] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable1.Types.TableFields)[]>(`
					SELECT *
					FROM ${testTable1.tableName}
					WHERE id = ?
				`, [id]));

				assert.equal(entities[0]?.title, title);
				assert.equal(entities[0]?.description, description);
			}

			await connection.query(`
				DELETE
				FROM ${testTable1.tableName}
				WHERE id = ?
			`, [id]);

			const [entities] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable1.Types.TableFields)[]>(`
				SELECT *
				FROM ${testTable1.tableName}
				WHERE id = ?
			`, [id]));

			assert.equal(entities[0], undefined);

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	});

	await t.test("getOneByPk found", async () => {
		const id = 1;

		const { one: exampleFound } = await testTable1.getOneByPk(id);

		if (exampleFound) {
			assert.equal(exampleFound.id, id);
		}
	});

	await t.test("getArrByParams", async () => {
		const res = await testTable1.getArrByParams({
			params: {},
		});

		assert.equal(res.length, 3);
	});

	await t.test("getArrByParams with ordering", async () => {
		{
			const res = await testTable1.getArrByParams({
				order: [{ orderBy: "title", ordering: "DESC" }],
				params: {},
			});

			assert.equal(res[0]?.title, "test 3");
		}
		{
			const res = await testTable1.getArrByParams({
				order: [{ orderBy: "title", ordering: "ASC" }],
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

		assert.equal(res.length, 2);
	});

	await t.test("getGuaranteedOneByParams found", async () => {
		const title = "test 1";

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { title },
		});

		assert.equal(!!exampleFound.id, true);
		assert.equal(!!exampleFound.created_at, true);
		assert.equal(!!exampleFound.updated_at, false);
		assert.equal(exampleFound.title, title);
	});

	await t.test("getOneByParams found", async () => {
		const title = "test 1";

		const { one: exampleFound } = await testTable1.getOneByParams({
			params: { title },
		});

		if (exampleFound) {
			assert.equal(!!exampleFound.id, true);
			assert.equal(!!exampleFound.created_at, true);
			assert.equal(!!exampleFound.updated_at, false);
			assert.equal(exampleFound.title, title);
		}
	});

	await t.test("getArrByParams found", async () => {
		const res = await testTable1.getArrByParams({
			params: {
				description: {
					$like: "%test%",
					$nlike: "%12345%",
				},
				id: {
					$gte: "3",
					$in: ["2", "3"],
					$lte: "3",
					$ne: null,
					$nin: ["1", "4"],
				},
			},
			paramsOr: [
				{ description: null, title: "test 1" },
				{
					description: {
						$like: "%tes%",
						$ne: null,
						$nlike: "%12345%",
					},
					title: "test 3",
				},
			],
		});

		assert.equal(res[0]?.title, "test 3");
	});

	await t.test("getArrByParams found { $custom: { sign: \"LIKE\", value: \"%test 3%\" }", async () => {
		const res = await testTable1.getArrByParams({
			params: {
				description: { $custom: { sign: "LIKE", value: "%test 3%" } },
			},
		});

		assert.equal(res[0]?.title, "test 3");
	});

	await t.test("getOneByParams not found", async () => {
		const title = "test 0";

		const { one: exampleNotFound } = await testTable1.getOneByParams({
			params: { title },
		});

		assert.equal(exampleNotFound, undefined);
	});

	await t.test("updateOneByPk", async () => {
		const title = "test 1";

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { title },
		});

		const titleUpdated = "test 1 updated";

		await testTable1.updateOneByPk(
			exampleFound.id,
			{ title: titleUpdated },
		);

		const exampleUpdatedFound = await testTable1.getGuaranteedOneByParams({
			params: { title: titleUpdated },
		});

		assert.equal(!!exampleUpdatedFound.id, true);
		assert.equal(!!exampleUpdatedFound.created_at, true);
		assert.equal(!!exampleUpdatedFound.updated_at, true);
		assert.equal(exampleUpdatedFound.title, titleUpdated);
	});

	await t.test("deleteOneByPk", async () => {
		const title = "test 1 updated";

		const exampleFound = await testTable1.getGuaranteedOneByParams({
			params: { title },
		});

		await testTable1.deleteOneByPk(exampleFound.id);

		const exampleUpdatedFound = await testTable1.getGuaranteedOneByParams({
			params: { id: exampleFound.id },
		});

		assert.equal(!!exampleUpdatedFound, false);
	});

	await t.test("deleteAll", async () => {
		await testTable1.deleteAll();

		const rowsCount = await testTable1.getCountByParams({
			params: {},
		});

		assert.equal(rowsCount, 0);
	});

	await t.test("custom function test()", async () => {
		const isNotTestFailed = await testTable1.test();

		assert.equal(isNotTestFailed, true);
	});

	await t.test("dropTable", async () => {
		const pool = MYSQL.BaseModel.getStandardPool(creds);
		const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);

		await pool.query(`DROP TABLE IF EXISTS ${testTable1.tableName};`);
		await pool.query(`DROP TABLE IF EXISTS ${testTable2.tableName};`);

		pool.end();
		transactionPool.end();
	});
});
