import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { MYSQL } from "../mysql.js";

import * as Helpers from "../helpers.js";

import * as TestTable01 from "./test-table-01/index.js";
import * as TestTable02 from "./test-table-02/index.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: MYSQL.ModelTypes.TDBCreds) => {
	const testTable01 = TestTable01.domain(creds);
	const testTable02 = TestTable02.domain(creds);

	return test("MYSQL-" + TEST_NAME, async (testContext) => {
		await testContext.test(
			"Helpers.migrationsUp",
			async () => { await Helpers.migrationsUp(creds, TEST_NAME); },
		);

		await testContext.test("createOne", async () => {
			const example1Id = await testTable01.createOne({ title: "test 1" });
			const example2Id = await testTable01.createOne({ title: "test 2" });
			const example3Id = await testTable01.createOne({ description: "test 3", title: "test 3" });
			const example4Id = await testTable01.createOne({ title: "test 4" });
			const example5Id = await testTable01.createOne({ title: "test 5" });

			assert.strictEqual(example1Id, 1);
			assert.strictEqual(example2Id, 2);
			assert.strictEqual(example3Id, 3);
			assert.strictEqual(example4Id, 4);
			assert.strictEqual(example5Id, 5);
		});

		await testContext.test("CRUD table 2", async () => {
			const example1Id = await testTable02.createOne({ title: "title" });

			assert.strictEqual(typeof example1Id, "number");

			{
				const { one: example1 } = await testTable02.getOneByParams({ params: { id: example1Id } });

				assert.strictEqual(typeof example1?.created_at, "number");
				assert.strictEqual(example1?.description, null);
				assert.strictEqual(typeof example1?.id, "number");
				assert.strictEqual(example1?.title, "title");
				assert.strictEqual(example1?.updated_at, null);
			}

			await testTable02.updateOneByPk(example1Id, {
				description: "description",
				title: "title updated",
			});

			const { one: example1 } = await testTable02.getOneByParams({ params: { id: example1Id } });

			assert.strictEqual(typeof example1?.created_at, "number");
			assert.strictEqual(example1?.description, "description");
			assert.strictEqual(typeof example1?.id, "number");
			assert.strictEqual(example1?.title, "title updated");
			assert.strictEqual(typeof example1?.updated_at, "number");

			await testTable02.deleteOneByPk(example1Id);

			const { one: example1Deleted } = await testTable02.getOneByParams({ params: { id: example1Id } });

			assert.strictEqual(example1Deleted, undefined);
		});

		await testContext.test("transaction 1", async () => {
			const transactionPool = MYSQL.BaseModel.getTransactionPool(creds);
			const connection = await transactionPool.getConnection();

			try {
				await connection.beginTransaction();

				await connection.query(`
					DELETE
					FROM ${testTable01.tableName}
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
					FROM ${testTable01.tableName}
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
						.getInsertFields<TestTable01.Types.CreateFields>({
							params: { description, title },
							tableName: testTable01.tableName,
						});

					const [inserted] = (await connection.query<MYSQL.ModelTypes.ResultSetHeader>(query, values));

					const [[entity]] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable01.Types.TableFields)[]>(`
						SELECT *
						FROM ${testTable01.tableName}
						WHERE id = ?
					`, [inserted.insertId]));

					if (!entity) throw new Error("Entity not found");

					assert.strictEqual(entity.title, title);
					assert.strictEqual(entity.description, description);

					id = entity.id;
				}

				{
					const description = "description transaction 1 updated";
					const title = "title transaction 1 updated";

					const { query, values } = MYSQL
						.BaseModel
						.getUpdateFields<TestTable01.Types.UpdateFields, TestTable01.Types.TableKeys>({
							params: { description, title },
							primaryKey: { field: "id", value: id },
							tableName: testTable01.tableName,
							updateField: testTable01.updateField,
						});

					await connection.query(query, values);

					const [entities] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable01.Types.TableFields)[]>(`
						SELECT *
						FROM ${testTable01.tableName}
						WHERE id = ?
					`, [id]));

					assert.strictEqual(entities[0]?.title, title);
					assert.strictEqual(entities[0]?.description, description);
				}

				await connection.query(`
					DELETE
					FROM ${testTable01.tableName}
					WHERE id = ?
				`, [id]);

				const [entities] = (await connection.query<(MYSQL.ModelTypes.RowDataPacket & TestTable01.Types.TableFields)[]>(`
					SELECT *
					FROM ${testTable01.tableName}
					WHERE id = ?
				`, [id]));

				assert.strictEqual(entities[0], undefined);

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

			const { one: example } = await testTable01.getOneByPk(id);

			assert.strictEqual(example?.id, id);
		});

		await testContext.test("getArrByParams", async () => {
			const res = await testTable01.getArrByParams({
				params: {},
			});

			assert.strictEqual(res.length, 3);
		});

		await testContext.test("getArrByParams with ordering", async () => {
			{
				const res = await testTable01.getArrByParams({
					order: [{ orderBy: "title", ordering: "DESC" }],
					params: {},
				});

				assert.strictEqual(res[0]?.title, "test 3");
			}
			{
				const res = await testTable01.getArrByParams({
					order: [{ orderBy: "title", ordering: "ASC" }],
					params: {},
				});

				assert.strictEqual(res[0]?.title, "test 1");
			}
		});

		await testContext.test("getArrByParams with params: { title: 'test 1' }", async () => {
			const res = await testTable01.getArrByParams({
				params: { title: "test 1" },
			});

			assert.strictEqual(res.length, 1);
		});

		await testContext.test("getArrByParams description: null", async () => {
			const res = await testTable01.getArrByParams({
				params: { description: null },
			});

			assert.strictEqual(res.length, 2);
		});

		await testContext.test("getOneByParams found", async () => {
			const title = "test 1";

			const { one: example } = await testTable01.getOneByParams({ params: { title } });

			assert.strictEqual(!!example?.id, true);
			assert.strictEqual(!!example?.created_at, true);
			assert.strictEqual(!!example?.updated_at, false);
			assert.strictEqual(example?.title, title);
		});

		await testContext.test("getArrByParams found", async () => {
			const res = await testTable01.getArrByParams({
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

			assert.strictEqual(res[0]?.title, "test 3");
		});

		await testContext.test("getArrByParams found { $custom: { sign: \"LIKE\", value: \"%test 3%\" }", async () => {
			const [entity] = await testTable01.getArrByParams({
				params: {
					description: { $custom: { sign: "LIKE", value: "%test 3%" } },
				},
			});

			assert.strictEqual(entity?.title, "test 3");
		});

		await testContext.test("getOneByParams not found", async () => {
			const title = "test 0";

			const { one: exampleNotFound } = await testTable01.getOneByParams({
				params: { title },
			});

			assert.strictEqual(exampleNotFound, undefined);
		});

		await testContext.test("updateOneByPk", async () => {
			const title = "test 1";

			const { one: example } = await testTable01.getOneByParams({ params: { title } });

			if (!example) throw new Error("example not found");

			const titleUpdated = "test 1 updated";

			await testTable01.updateOneByPk(example.id, { title: titleUpdated });

			{
				const { one: example } = await testTable01.getOneByParams({ params: { title: titleUpdated } });

				assert.strictEqual(!!example?.id, true);
				assert.strictEqual(!!example?.created_at, true);
				assert.strictEqual(!!example?.updated_at, true);
				assert.strictEqual(example?.title, titleUpdated);
			}
		});

		await testContext.test("deleteOneByPk", async () => {
			const title = "test 1 updated";
			let exampleId = -1;

			{
				const { one: example } = await testTable01.getOneByParams({ params: { title } });

				if (!example) throw new Error("example not found");

				await testTable01.deleteOneByPk(example.id);

				exampleId = example.id;
			}

			{
				const { one: example } = await testTable01.getOneByParams({ params: { id: exampleId } });

				assert.strictEqual(!!example, false);
			}
		});

		await testContext.test("deleteAll", async () => {
			await testTable01.deleteAll();

			const rowsCount = await testTable01.getCountByParams({
				params: {},
			});

			assert.strictEqual(rowsCount, 0);
		});

		await testContext.test("custom function test()", async () => {
			const isNotFailed = await testTable01.test();

			assert.strictEqual(isNotFailed, true);
		});

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
