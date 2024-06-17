import assert from "node:assert";
import test from "node:test";

import { MYSQL } from "../../index.js";

import * as TestTable1 from "./test-table-1/index.js";
import * as TestTable2 from "./test-table-2/index.js";

export const start = async (creds: MYSQL.ModelTypes.TDBCreds) => {
	const testTable1 = new TestTable1.Domain(creds);
	const testTable2 = new TestTable2.Domain(creds);

	return test("top level test MYSQL", async (testContext) => {
		await testContext.test("createTable", async () => {
			const pool = MYSQL.BaseModel.getStandardPool(creds);

			await pool.query(`DROP TABLE IF EXISTS ${testTable1.tableName};`);
			await pool.query(`
			CREATE TABLE ${testTable1.tableName}(
			  id                              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,

			  description                     varchar(255),
			  title                           varchar(255) NOT NULL,

			  created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
			  updated_at                      DATETIME
			);
		`);

			await pool.query(`DROP TABLE IF EXISTS ${testTable2.tableName};`);
			await pool.query(`
			CREATE TABLE ${testTable2.tableName}(
			  id                              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,

			  description                     varchar(255),
			  title                           varchar(255) NOT NULL,

			  created_at                      BIGINT DEFAULT (ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)),
			  updated_at                      BIGINT
			);
		`);
		});

		await testContext.test("createOne", async () => {
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

		await testContext.test("CRUD table 2", async () => {
			const example1Id = await testTable2.createOne({ title: "title" });

			assert.equal(typeof example1Id, "number");

			{
				const { one: example1 } = await testTable2.getOneByParams({ params: { id: example1Id } });

				assert.equal(typeof example1?.created_at, "number");
				assert.equal(example1?.description, null);
				assert.equal(typeof example1?.id, "number");
				assert.equal(example1?.title, "title");
				assert.equal(example1?.updated_at, null);
			}

			await testTable2.updateOneByPk(example1Id, {
				description: "description",
				title: "title updated",
			});

			const { one: example1 } = await testTable2.getOneByParams({ params: { id: example1Id } });

			assert.equal(typeof example1?.created_at, "number");
			assert.equal(example1?.description, "description");
			assert.equal(typeof example1?.id, "number");
			assert.equal(example1?.title, "title updated");
			assert.equal(typeof example1?.updated_at, "number");

			await testTable2.deleteOneByPk(example1Id);

			const { one: example1Deleted } = await testTable2.getOneByParams({ params: { id: example1Id } });

			assert.equal(example1Deleted, undefined);
		});

		await testContext.test("transaction 1", async () => {
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

		await testContext.test("transaction 2", async () => {
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

		await testContext.test("transaction 3", async () => {
			const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);
			const connection = await transactionPool.getConnection();

			try {
				await connection.beginTransaction();

				let id = -1;

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

					const [[entity]] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable1.Types.TableFields)[]>(`
					SELECT *
					FROM ${testTable1.tableName}
					WHERE id = ?
				`, [inserted.insertId]));

					if (!entity) throw new Error("Entity not found");

					assert.equal(entity.title, title);
					assert.equal(entity.description, description);

					id = entity.id;
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

		await testContext.test("getOneByPk found", async () => {
			const id = 1;

			const { one: example } = await testTable1.getOneByPk(id);

			assert.equal(example?.id, id);
		});

		await testContext.test("getArrByParams", async () => {
			const res = await testTable1.getArrByParams({
				params: {},
			});

			assert.equal(res.length, 3);
		});

		await testContext.test("getArrByParams with ordering", async () => {
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

		await testContext.test("getArrByParams with params: {title: 'test 1'}", async () => {
			const res = await testTable1.getArrByParams({
				params: { title: "test 1" },
			});

			assert.equal(res.length, 1);
		});

		await testContext.test("getArrByParams description: null", async () => {
			const res = await testTable1.getArrByParams({
				params: { description: null },
			});

			assert.equal(res.length, 2);
		});

		await testContext.test("getOneByParams found", async () => {
			const title = "test 1";

			const { one: example } = await testTable1.getOneByParams({ params: { title } });

			assert.equal(!!example?.id, true);
			assert.equal(!!example?.created_at, true);
			assert.equal(!!example?.updated_at, false);
			assert.equal(example?.title, title);
		});

		await testContext.test("getArrByParams found", async () => {
			const res = await testTable1.getArrByParams({
				params: {
					description: {
						$like: "%test%",
						$nlike: "%12345%",
					},
					id: {
						$gte: 3,
						$in: [2, 3],
						$lte: 3,
						$ne: null,
						$nin: [1, 4],
					},
					updated_at: null,
				},
				paramsOr: [
					{ description: null, title: "test 1" },
					{
						description: {
							$like: "%tes%",
							$ne: null,
							$nlike: "%12345%",
						},
						title: { $eq: "test 3" },
					},
				],
			});

			assert.equal(res[0]?.title, "test 3");
		});

		await testContext.test("getArrByParams found { $custom: { sign: \"LIKE\", value: \"%test 3%\" }", async () => {
			const [entity] = await testTable1.getArrByParams({
				params: {
					description: { $custom: { sign: "LIKE", value: "%test 3%" } },
				},
			});

			assert.equal(entity?.title, "test 3");
		});

		await testContext.test("getOneByParams not found", async () => {
			const title = "test 0";

			const { one: exampleNotFound } = await testTable1.getOneByParams({
				params: { title },
			});

			assert.equal(exampleNotFound, undefined);
		});

		await testContext.test("updateOneByPk", async () => {
			const title = "test 1";

			const { one: example } = await testTable1.getOneByParams({ params: { title } });

			if (!example) throw new Error("example not found");

			const titleUpdated = "test 1 updated";

			await testTable1.updateOneByPk(example.id, { title: titleUpdated });

			{
				const { one: example } = await testTable1.getOneByParams({ params: { title: titleUpdated } });

				assert.equal(!!example?.id, true);
				assert.equal(!!example?.created_at, true);
				assert.equal(!!example?.updated_at, true);
				assert.equal(example?.title, titleUpdated);
			}
		});

		await testContext.test("deleteOneByPk", async () => {
			const title = "test 1 updated";
			let exampleId = -1;

			{
				const { one: example } = await testTable1.getOneByParams({ params: { title } });

				if (!example) throw new Error("example not found");

				await testTable1.deleteOneByPk(example.id);

				exampleId = example.id;
			}

			{
				const { one: example } = await testTable1.getOneByParams({ params: { id: exampleId } });

				assert.equal(!!example, false);
			}
		});

		await testContext.test("deleteAll", async () => {
			await testTable1.deleteAll();

			const rowsCount = await testTable1.getCountByParams({
				params: {},
			});

			assert.equal(rowsCount, 0);
		});

		await testContext.test("custom function test()", async () => {
			const isNotFailed = await testTable1.test();

			assert.equal(isNotFailed, true);
		});

		await testContext.test(
			"dropTable",
			async () => {
				const pool = MYSQL.BaseModel.getStandardPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${testTable1.tableName};`);
				await pool.query(`DROP TABLE IF EXISTS ${testTable2.tableName};`);
			},
		);

		await testContext.test(
			"remove pools",
			async () => {
				await MYSQL.BaseModel.removeStandardPool(creds);
				await MYSQL.BaseModel.removeTransactionPool(creds);
			},
		);
	});
};
