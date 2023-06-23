import assert from "node:assert";
import test from "node:test";

import { MYSQL } from "../../index.js";

import * as TestTable from "./testTable/domain.js";

const creds = {
	database: "test-base",
	host: process.env.MYSQL_HOST || "localhost",
	password: "test-password",
	port: parseInt(process.env.MYSQL_PORT || "", 10) || 3306,
	user: "test-user",
};

const testTable = new TestTable.default(creds);

test("top level test MYSQL", async (t) => {
	await t.test("createTable", async () => {
		const pool = MYSQL.BaseModel.getStandartPool(creds);

		await pool.query("DROP TABLE IF EXISTS test_table;");

		await pool.query(`
			CREATE TABLE test_table(
			  id                              INT NOT NULL AUTO_INCREMENT,

			  description                     varchar(255),
			  title                           varchar(255) NOT NULL,

			  created_at                      DATETIME DEFAULT CURRENT_TIMESTAMP,
			  updated_at                      DATETIME,
			  PRIMARY KEY (id)
			);
		`);
	});

	await t.test("createOne", async () => {
		const example1Id = await testTable.createOne({ title: "test 1" });
		const example2Id = await testTable.createOne({ title: "test 2" });
		const example3Id = await testTable.createOne({ description: "test 3", title: "test 3" });
		const example4Id = await testTable.createOne({ title: "test 4" });
		const example5Id = await testTable.createOne({ title: "test 5" });

		assert.equal(example1Id, 1);
		assert.equal(example2Id, 2);
		assert.equal(example3Id, 3);
		assert.equal(example4Id, 4);
		assert.equal(example5Id, 5);
	});

	await t.test("transaction 1", async () => {
		const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);
		const connection = await transactionPool.getConnection();

		try {
			await connection.beginTransaction();

			await connection.query(`
				DELETE
				FROM test_table
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
				FROM test_table
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
					.getInsertFields<TestTable.Types.CreateFields>({
						params: { description, title },
						tableName: testTable.tableName,
					});

				const [inserted] = (await connection.query<MYSQL.ModelTypes.ResultSetHeader>(query, values));

				const [entites] = (await connection.query<MYSQL.ModelTypes.RowDataPacket[]>(`
					SELECT *
					FROM test_table
					WHERE id = ?
				`, [inserted?.insertId]));

				assert.equal(entites[0]?.title, title);
				assert.equal(entites[0]?.description, description);

				id = entites[0]?.id as string;
			}

			{
				const description = "description transaction 1 updated";
				const title = "title transaction 1 updated";

				const { query, values } = MYSQL
					.BaseModel
					.getUpdateFields<TestTable.Types.UpdateFields, TestTable.Types.TableKeys>({
						params: { description, title },
						primaryKey: { field: "id", value: id },
						tableName: testTable.tableName,
						updateField: testTable.updateField,
					});

				await connection.query(query, values);

				const [entites] = (await connection.query<MYSQL.ModelTypes.RowDataPacket[]>(`
					SELECT *
					FROM test_table
					WHERE id = ?
				`, [id]));

				assert.equal(entites[0]?.title, title);
				assert.equal(entites[0]?.description, description);
			}

			await connection.query(`
				DELETE
				FROM test_table
				WHERE id = ?
			`, [id]);

			const [entites] = (await connection.query<MYSQL.ModelTypes.RowDataPacket[]>(`
			SELECT *
			FROM test_table
			WHERE id = ?
		`, [id]));

			assert.equal(entites[0], undefined);

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

		const { one: exampleFound } = await testTable.getOneByPk(id);

		if (exampleFound) {
			assert.equal(exampleFound.id, id);
		}
	});

	await t.test("getArrByParams", async () => {
		const res = await testTable.getArrByParams({
			params: {},
		});

		assert.equal(res.length, 3);
	});

	await t.test("getArrByParams with ordering", async () => {
		{
			const res = await testTable.getArrByParams({
				order: [{ orderBy: "title", ordering: "DESC" }],
				params: {},
			});

			assert.equal(res[0]?.title, "test 3");
		}
		{
			const res = await testTable.getArrByParams({
				order: [{ orderBy: "title", ordering: "ASC" }],
				params: {},
			});

			assert.equal(res[0]?.title, "test 1");
		}
	});

	await t.test("getArrByParams with params: {title: 'test 1'}", async () => {
		const res = await testTable.getArrByParams({
			params: { title: "test 1" },
		});

		assert.equal(res.length, 1);
	});

	await t.test("getArrByParams description: null", async () => {
		const res = await testTable.getArrByParams({
			params: { description: null },
		});

		assert.equal(res.length, 2);
	});

	await t.test("getGuaranteedOneByParams found", async () => {
		const title = "test 1";

		const exampleFound = await testTable.getGuaranteedOneByParams({
			params: { title },
		});

		assert.equal(!!exampleFound.id, true);
		assert.equal(!!exampleFound.created_at, true);
		assert.equal(!!exampleFound.updated_at, false);
		assert.equal(exampleFound.title, title);
	});

	await t.test("getOneByParams found", async () => {
		const title = "test 1";

		const { one: exampleFound } = await testTable.getOneByParams({
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
		const res = await testTable.getArrByParams({
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
		const res = await testTable.getArrByParams({
			params: {
				description: { $custom: { sign: "LIKE", value: "%test 3%" } },
			},
		});

		assert.equal(res[0]?.title, "test 3");
	});

	await t.test("getOneByParams not found", async () => {
		const title = "test 0";

		const { one: exampleNotFound } = await testTable.getOneByParams({
			params: { title },
		});

		assert.equal(exampleNotFound, undefined);
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
		const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);

		await pool.query("DROP TABLE IF EXISTS test_table;");

		pool.end();
		transactionPool.end();
	});
});
