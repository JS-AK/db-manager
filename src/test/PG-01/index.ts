import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as TestTable1 from "./test-table-1/domain.js";
import * as TestTable2 from "./test-table-2/domain.js";
import * as TestTable3 from "./test-table-3/domain.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

export default async () => {
	const testTable1 = new TestTable1.default(creds);
	const testTable2 = new TestTable2.default(creds);
	const testTable3 = new TestTable3.default(creds);

	return test("PG-01", async (t) => {
		await t.test("createTables", async () => {
			const pool = PG.BaseModel.getStandartPool(creds);

			await pool.query(`
				DROP TABLE IF EXISTS test_table_1;

				CREATE TABLE test_table_1(
					id                              BIGSERIAL PRIMARY KEY,

					description                     TEXT,
					number_key                      INT,
					number_range                    INT8RANGE,
					meta                            JSONB NOT NULL,
					title                           TEXT NOT NULL,

					created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at                      TIMESTAMP WITH TIME ZONE
				);
			`);

			await pool.query(`
				DROP TABLE IF EXISTS test_table_2;

				CREATE TABLE test_table_2(
					id                              BIGSERIAL PRIMARY KEY,

					description                     TEXT,
					meta                            JSONB NOT NULL,
					title                           TEXT NOT NULL,

					created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at                      TIMESTAMP WITH TIME ZONE
				);
			`);

			await pool.query(`
				DROP TABLE IF EXISTS test_table_3;

				CREATE TABLE test_table_3(
					title                           TEXT NOT NULL
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

			await testTable1.createOne({ description: "test", meta, number_key: 0, number_range: "[100,200]", title: "test 2" });
			await testTable1.createOne({ meta, title: "test 3" });
			await testTable1.createOne({ meta, title: "test 4" });
			await testTable1.createOne({ meta, title: "test 5" });
		});

		await t.test("transaction 1", async () => {
			const transactionPool = PG.BaseModel.getTransactionPool(creds);
			const client = await transactionPool.connect();

			try {
				await client.query("BEGIN");

				let id = "";

				{
					const title = "title transaction 1";

					const { query, values } = PG
						.BaseModel
						.getInsertFields<
							TestTable2.Types.CreateFields,
							TestTable2.Types.TableKeys
						>({
							params: {
								meta: { firstname: "test", lastname: "test" },
								title,
							},
							returning: ["id", "title"],
							tableName: testTable2.tableName,
						});

					const data = (await client.query(query, values)).rows[0];

					assert.equal(data.title, title);

					id = data.id;
				}

				{
					const meta = {
						firstname: "test updated",
						lastname: "test updated",
					};
					const title = "title transaction 1 updated";

					const { query, values } = PG
						.BaseModel
						.getUpdateFields<
							TestTable2.Types.UpdateFields,
							TestTable2.Types.TableKeys
						>({
							params: { meta, title },
							primaryKey: { field: "id", value: id },
							returning: ["id", "meta", "title"],
							tableName: testTable2.tableName,
							updateField: testTable2.updateField,
						});

					const data = (await client.query(query, values)).rows[0];

					assert.equal(data.meta.firstname, meta.firstname);
					assert.equal(data.meta.lastname, meta.lastname);
					assert.equal(data.title, title);

					id = data.id;
				}

				await client.query(`
					DELETE
					FROM test_table_2
					WHERE id = $1
				`, [id]);

				const { one } = await testTable2.getOneByPk(id);

				assert.equal(one, undefined);

				await client.query("COMMIT");
			} catch (e) {
				await client.query("ROLLBACK");
				throw e;
			} finally {
				client.release();
			}
		});

		await t.test("transaction 2", async () => {
			const transactionPool = PG.BaseModel.getTransactionPool(creds);
			const client = await transactionPool.connect();

			try {
				await client.query("BEGIN");
				const title = "title transaction 2";

				const { query, values } = PG.BaseModel.getInsertFields({
					params: {
						meta: { firstname: "test", lastname: "test" },
						title,
					},
					returning: ["id", "title"],
					tableName: testTable2.tableName,
				});

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

		await t.test(
			"getArrByParams [params: {}]",
			async () => {
				const res = await testTable1.getArrByParams({ params: {} });

				assert.equal(res.length, 5);
			},
		);

		await t.test(
			"getArrByParams [params: { description: { $like: 'test', $nlike: '%TTT%' }, id: { $gte: '2', $in: ['1', '2'], $lte: '2', $ne: null, $nin: ['3', '4'] } }, paramsOr: [{ description: null, title: 'test 1' }, { description: { $like: '%tes%', $ne: null, $nlike: '%12345%' }, title: 'test 2' }]]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: {
						description: { $like: "test", $nlike: "%TTT%" },
						id: { $gte: "2", $in: ["1", "2"], $lte: "2", $ne: null, $nin: ["3", "4"] },
					},
					paramsOr: [
						{ description: null, title: "test 1" },
						{ description: { $like: "%tes%", $ne: null, $nlike: "%12345%" }, title: "test 2" },
					],
				});

				assert.equal(res[0]?.title, "test 2");
			},
		);

		await t.test(
			"getArrByParams [params: { number_key: { $gte: 0 }]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: { number_key: { $gte: 0 } },
				});

				assert.equal(res[0]?.title, "test 2");
			},
		);

		await t.test(
			"getArrByParams [params: { number_key: { $between: [0, 1] }]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: { number_key: { $between: [0, 1] } },
				});

				assert.equal(res[0]?.title, "test 2");
			},
		);

		await t.test(
			"getArrByParams [params: { number_key: { $nbetween: [1, 2] }]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: { number_key: { $nbetween: [1, 2] } },
				});

				assert.equal(res[0]?.title, "test 2");
			},
		);

		await t.test(
			"getArrByParams [order: [{ orderBy: 'title', ordering: 'DESC' }], params: {}]",
			async () => {
				{
					const res = await testTable1.getArrByParams({
						order: [{ orderBy: "title", ordering: "DESC" }],
						params: {},
					});

					assert.equal(res[0]?.title, "test 5");
				}
				{
					const res = await testTable1.getArrByParams({
						order: [
							{ orderBy: "title", ordering: "ASC" },
							{ orderBy: "description", ordering: "DESC" },
						],
						params: {},
					});

					assert.equal(res[0]?.title, "test 1");
				}
			},
		);

		await t.test(
			"getArrByParams with [params: { title: 'test 1' }]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: { title: "test 1" },
				});

				assert.equal(res.length, 1);
			},
		);

		await t.test(
			"getArrByParams with [params: { number_range: { $custom: { sign: '@>', value: '[150,150]' } }]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: { number_range: { $custom: { sign: "@>", value: "[150,150]" } } },
				});

				assert.equal(res[0]?.title, "test 2");
			},
		);

		await t.test(
			"getArrByParams [params: { description: null }]",
			async () => {
				const res = await testTable1.getArrByParams({
					params: { description: null },
				});

				assert.equal(res.length, 4);
			},
		);

		await t.test(
			"getGuaranteedOneByParams [params: { meta: { $jsonb: meta }, title }]",
			async () => {
				const title = "title transaction 2";
				const meta = { firstname: "test", lastname: "test" };

				const exampleFound = await testTable2.getGuaranteedOneByParams({
					params: { meta: { $jsonb: meta }, title },
				});

				assert.equal(!!exampleFound.id, true);
				assert.equal(!!exampleFound.created_at, true);
				assert.equal(!!exampleFound.updated_at, false);
				assert.equal(exampleFound.title, title);
				assert.equal(exampleFound.meta.firstname, meta.firstname);
				assert.equal(exampleFound.meta.lastname, meta.lastname);
			},
		);

		await t.test(
			"getGuaranteedOneByParams [params: { title: { $like: title } }]",
			async () => {
				const titleOrigin = "test 1";
				const title = "%est 1%";

				const exampleFound = await testTable1.getGuaranteedOneByParams({
					params: { title: { $like: title } },
				});

				assert.equal(exampleFound.title, titleOrigin);
			},
		);

		await t.test(
			"getGuaranteedOneByParams [{ description: { $ne: null } }]",
			async () => {
				const titleOrigin = "test 2";

				const exampleFound = await testTable1.getGuaranteedOneByParams({
					params: { description: { $ne: null } },
				});

				assert.equal(exampleFound.title, titleOrigin);
			},
		);

		await t.test("updateOneByPk", async () => {
			const meta = { firstname: "test", lastname: "test" };
			const title = "test 1";

			const exampleFound = await testTable1.getGuaranteedOneByParams({
				params: { meta: { $jsonb: meta }, title },
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

		await t.test("testing table without id createField updateField", async () => {
			{
				const testValue = await testTable3.createOne({
					title: "test 1",
				});

				assert.equal(testValue.title, "test 1");
			}

			{
				const testValue = await testTable3.getGuaranteedOneByParams({
					params: { title: "test 1" },
				});

				assert.equal(testValue.title, "test 1");
			}

			{
				const testValue = await testTable3.updateByParams(
					{ params: { title: "test 1" } },
					{ title: "test 1 updated" },
				);

				assert.equal(testValue[0]?.title, "test 1 updated");
			}

			{
				const testValue = await testTable3.getGuaranteedOneByParams({
					params: { title: "test 1 updated" },
				});

				assert.equal(testValue.title, "test 1 updated");
			}

			{
				await testTable3.deleteByParams(
					{ params: { title: "test 1 updated" } },
				);
			}

			{
				const testValue = await testTable3.getArrByParams({
					params: {},
				});

				assert.equal(testValue.length, 0);
			}
		});

		await t.test(
			"dropTables",
			async () => {
				const pool = PG.BaseModel.getStandartPool(creds);

				await pool.query("DROP TABLE IF EXISTS test_table_1;");
				await pool.query("DROP TABLE IF EXISTS test_table_2;");
				await pool.query("DROP TABLE IF EXISTS test_table_3;");
			},
		);

		await t.test(
			"remove pools",
			async () => {
				await PG.BaseModel.removeStandartPool(creds);
				await PG.BaseModel.removeTransactionPool(creds);
			},
		);
	});
};
