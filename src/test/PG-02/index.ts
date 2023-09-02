import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as TestTable from "./test-table-pg-02/domain.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

export default async () => {
	const testTable = new TestTable.default(creds);

	return test("PG-02", async (testContext) => {
		await testContext.test(
			"create tables",
			async () => {
				const pool = PG.BaseModel.getStandartPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${testTable.tableName};

					CREATE TABLE ${testTable.tableName}(
					  id                              BIGSERIAL PRIMARY KEY,

					  description                     TEXT,
					  number_key                      INT NOT NULL,
					  number_range                    INT8RANGE,
					  meta                            JSONB NOT NULL,
					  title                           TEXT NOT NULL,

					  created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					  updated_at                      TIMESTAMP WITH TIME ZONE
					);
				`);
			},
		);

		await testContext.test(
			"deleteAll",
			async () => {
				await testTable.deleteAll();
				const entities = await testTable.getArrByParams({ params: {} });

				assert.equal(entities.length, 0);
			},
		);

		await testContext.test(
			"createOne",
			async () => {
				const params = {
					meta: { firstname: "firstname", lastname: "lastname" },
					number_key: 1,
					title: "title",
				};

				const entity = await testTable.createOne(params);

				assert.equal(!!entity.id, true);
				assert.equal(entity.meta.firstname, params.meta.firstname);
				assert.equal(entity.meta.lastname, params.meta.lastname);
				assert.equal(entity.title, params.title);

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"transaction getInsertFields getUpdateFields",
			async () => {
				const transactionPool = PG.BaseModel.getTransactionPool(creds);
				const client = await transactionPool.connect();

				try {
					await client.query("BEGIN");

					const params = {
						meta: { firstname: "firstname", lastname: "lastname" },
						number_key: 1,
						title: "title",
					};

					const { query, values } = PG
						.BaseModel
						.getInsertFields<
							TestTable.Types.CreateFields,
							TestTable.Types.TableKeys
						>({
							params,
							returning: ["id"],
							tableName: testTable.tableName,
						});

					const id = (await client.query<{ id: string; }>(query, values)).rows[0]?.id;

					assert.equal(!!id, true);

					{
						const data = (await client.query<{
							meta: { firstname: string; lastname: string; };
							title: string;
						}>(
							`
								SELECT meta, title
								FROM ${testTable.tableName}
								WHERE id = $1
							`,
							[id],
						)).rows[0];

						assert.equal(data?.meta.firstname, params.meta.firstname);
						assert.equal(data?.meta.lastname, params.meta.lastname);
						assert.equal(data?.title, params.title);
					}

					{
						const paramsToUpdate = {
							meta: { firstname: "firstname updated", lastname: "lastname updated" },
							title: "title updated",
						};

						const { query, values } = PG
							.BaseModel
							.getUpdateFields<
								TestTable.Types.UpdateFields,
								TestTable.Types.TableKeys
							>({
								params: paramsToUpdate,
								primaryKey: { field: "id", value: id as string },
								tableName: testTable.tableName,
								updateField: testTable.updateField,
							});

						await client.query(query, values);

						{
							const data = (await client.query<{
								meta: { firstname: string; lastname: string; };
								title: string;
							}>(
								`
									SELECT meta, title
									FROM ${testTable.tableName}
									WHERE id = $1
								`,
								[id],
							)).rows[0];

							assert.equal(data?.meta.firstname, paramsToUpdate.meta.firstname);
							assert.equal(data?.meta.lastname, paramsToUpdate.meta.lastname);
							assert.equal(data?.title, paramsToUpdate.title);
						}
					}

					await client.query(`DELETE FROM ${testTable.tableName}`);

					{
						const data = (await client.query<{
							meta: { firstname: string; lastname: string; };
							title: string;
						}>(
							`
								SELECT meta, title
								FROM ${testTable.tableName}
								WHERE id = $1
							`,
							[id],
						)).rows[0];

						assert.equal(data, undefined);
					}

					await client.query("COMMIT");
				} catch (e) {
					await client.query("ROLLBACK");
					throw e;
				} finally {
					client.release();
				}
			},
		);

		await testContext.test(
			"getArrByParams",
			async (testContext) => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstname: `firstname ${e}`, lastname: `lastname ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}00]`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				await testContext.test(
					"{ params: {} }",
					async () => {
						const res = await testTable.getArrByParams({ params: {} });

						assert.equal(res.length, 5);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $between: [1, 2] } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $between: [1, 2] } },
						});

						assert.equal(res.length, 2);
					},
				);

				await testContext.test(
					"{ params: { number_range: { $custom: { sign: \"@>\", value: \"[150,150]\" } } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_range: { $custom: { sign: "@>", value: "[150,150]" } } },
						});

						assert.equal(res.length, 1);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $gt: 2 } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $gt: 2 } },
						});

						assert.equal(res.length, 3);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $gte: 2 } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $gte: 2 } },
						});

						assert.equal(res.length, 4);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $in: [1, 2] } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $in: [1, 2] } },
						});

						assert.equal(res.length, 2);
					},
				);

				await testContext.test(
					"{ params: { description: { $like: \"%description%\" } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { description: { $like: "%description%" } },
						});

						assert.equal(res.length, 5);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $lt: 5 } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $lt: 5 } },
						});

						assert.equal(res.length, 4);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $lte: 5 } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $lte: 5 } },
						});

						assert.equal(res.length, 5);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $nbetween: [1, 2] } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $nbetween: [1, 2] } },
						});

						assert.equal(res.length, 3);
					},
				);

				await testContext.test(
					"{ params: { number_key: { $ne: 1 } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $ne: 1 } },
						});

						assert.equal(res.length, 4);
					});

				await testContext.test(
					"{ params: { number_key: { $ne: null } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $ne: null } },
						},
						);

						assert.equal(res.length, 5);
					});

				await testContext.test(
					"{ params: { number_key: { $nin: [1, 2] } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { number_key: { $nin: [1, 2] } },
						});

						assert.equal(res.length, 3);
					},
				);

				await testContext.test(
					"{ params: { description: { $nlike: \"%description %\" } } }",
					async () => {
						const res = await testTable.getArrByParams({
							params: { description: { $nlike: "%description%" } },
						});

						assert.equal(res.length, 0);
					},
				);

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"custom function",
			async () => {
				const isNotTestFailed = await testTable.test();

				assert.equal(isNotTestFailed, true);
			},
		);

		await testContext.test(
			"dropTable",
			async () => {
				const pool = PG.BaseModel.getStandartPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${testTable.tableName};`);
			},
		);

		await testContext.test(
			"remove pools",
			async () => {
				await PG.BaseModel.removeStandartPool(creds);
				await PG.BaseModel.removeTransactionPool(creds);
			},
		);
	});
};
