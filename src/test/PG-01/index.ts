import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as TestTable from "./test-table-01/index.js";
import { isHasFields } from "../../shared-helpers/index.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

export default async () => {
	const testTable = new TestTable.Domain(creds);

	return test("PG-01", async (testContext) => {
		await testContext.test(
			"create table",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${testTable.tableName};

					CREATE TABLE ${testTable.tableName}(
					  id                              BIGSERIAL PRIMARY KEY,

					  books                           TEXT[],
					  description                     TEXT,
					  meta                            JSONB NOT NULL,
					  number_key                      INT NOT NULL,
					  number_range                    INT8RANGE,
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
					meta: { firstName: "firstName", lastName: "lastName" },
					number_key: 1,
					title: "title",
				};

				const entity = await testTable.createOne(params);

				assert.equal(!!entity.id, true);
				assert.equal(entity.meta.firstName, params.meta.firstName);
				assert.equal(entity.meta.lastName, params.meta.lastName);
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
						meta: { firstName: "firstName", lastName: "lastName" },
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
							meta: { firstName: string; lastName: string; };
							title: string;
						}>(
							`
								SELECT meta, title
								FROM ${testTable.tableName}
								WHERE id = $1
							`,
							[id],
						)).rows[0];

						assert.equal(data?.meta.firstName, params.meta.firstName);
						assert.equal(data?.meta.lastName, params.meta.lastName);
						assert.equal(data?.title, params.title);
					}

					{
						const paramsToUpdate = {
							meta: { firstName: "firstName updated", lastName: "lastName updated" },
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
								meta: { firstName: string; lastName: string; };
								title: string;
							}>(
								`
									SELECT meta, title
									FROM ${testTable.tableName}
									WHERE id = $1
								`,
								[id],
							)).rows[0];

							assert.equal(data?.meta.firstName, paramsToUpdate.meta.firstName);
							assert.equal(data?.meta.lastName, paramsToUpdate.meta.lastName);
							assert.equal(data?.title, paramsToUpdate.title);
						}
					}

					await client.query(`DELETE FROM ${testTable.tableName}`);

					{
						const data = (await client.query<{
							meta: { firstName: string; lastName: string; };
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
			"getCountByParams",
			async () => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				const count = await testTable.getCountByParams({ params: {} });

				assert.equal(count, 5);

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"getCountByPks",
			async () => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				const ids = (await testTable.getArrByParams({ params: {} })).map((e) => e.id);
				const count = await testTable.getCountByPks(ids);

				assert.equal(count, 5);

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"getCountByPksAndParams",
			async () => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				const ids = (await testTable.getArrByParams({ params: {} })).map((e) => e.id);
				const count = await testTable.getCountByPksAndParams(
					ids,
					{ params: { number_key: 1 } },
				);

				assert.equal(count, 1);

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"getArrByParams",
			async (testContext) => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				{
					const params = {
						params: {} as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 5);
							assert.equal(isHasFields(res[0] as TestTable.Types.TableFields, ["books", "created_at", "description", "id", "meta", "number_key", "number_range", "title", "updated_at"]), true);
						},
					);
				}

				{
					const params = {
						params: {} as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
						selected: ["number_key"] as ["number_key"],
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 5);
							assert.equal(isHasFields(res[0] as TestTable.Types.TableFields, ["number_key"]), true);
							assert.equal(isHasFields(res[0] as TestTable.Types.TableFields, ["books", "created_at", "description", "id", "meta", "number_range", "title", "updated_at"]), false);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $between: [1, 2] } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 2);
						},
					);
				}

				{
					const params = {
						params: { number_range: { $custom: { sign: "@>", value: "[150,151)" } } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 1);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $gt: 2 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 3);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $gte: 2 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 4);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $in: [1, 2] } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 2);
						},
					);
				}

				{
					const params = {
						params: { description: { $like: "%description%" } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 5);
						},
					);
				}

				{
					const params = {
						params: { description: { $ilike: "%DESCRIPTION%" } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 5);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $lt: 5 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 4);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $lte: 5 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 5);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $nbetween: [1, 2] } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 3);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $ne: 1 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 4);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $ne: null } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 5);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $nin: [1, 2] } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 3);
						},
					);
				}

				{
					const params = {
						params: { description: { $nlike: "%description%" } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 0);
						},
					);
				}

				{
					const params = {
						params: { description: { $nilike: "%DESCRIPTION%" } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 0);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $in: [1, 2] } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
						paramsOr: [{ number_key: 1 }, { number_key: 2 }] as PG.DomainTypes.TArray2OrMore<PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 2);
						},
					);
				}

				{
					const params = {
						pagination: { limit: 1, offset: 1 },
						params: { number_key: { $in: [1, 2] } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
						paramsOr: [{ number_key: 1 }, { number_key: 2 }] as PG.DomainTypes.TArray2OrMore<PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getArrByParams(params);

							assert.equal(res.length, 1);
						},
					);
				}

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"getOneByParams",
			async (testContext) => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						books: ["book 1"],
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				{
					const params = {
						params: { number_key: 1 } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getOneByParams({
								params: { number_key: 1 },
							});

							assert.equal(res.one?.number_key, 1);
							assert.equal(isHasFields(res.one as TestTable.Types.TableFields, ["books", "created_at", "description", "id", "meta", "number_key", "number_range", "title", "updated_at"]), true);
						},
					);
				}

				{
					const params = {
						params: { number_key: 1 } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
						selected: ["number_key"] as ["number_key"],
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getOneByParams({
								params: params.params,
								selected: params.selected,
							});

							assert.equal(res.one?.number_key, 1);
							assert.equal(isHasFields(res.one as TestTable.Types.TableFields, ["number_key"]), true);
							assert.equal(isHasFields(res.one as TestTable.Types.TableFields, ["books", "created_at", "description", "id", "meta", "number_range", "title", "updated_at"]), false);
						},
					);
				}

				{
					const likeText = "description 5";
					const params = {
						params: { description: { $like: `%${likeText}%` } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getOneByParams(params);

							assert.equal(res.one?.description, likeText);
						},
					);
				}

				{
					const likeText = "description 5";
					const params = {
						params: {
							books: { "$&&": ["book 1"] },
							description: [
								{ $like: `%${likeText}%` },
								{ $like: likeText },
								{ $nlike: "ABC" },
								{ $ne: null },
							],
						} as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getOneByParams(params);

							assert.equal(res.one?.description, likeText);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $lt: 2 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getOneByParams(params);

							assert.equal(res.one?.number_key, 1);
						},
					);
				}

				{
					const params = {
						params: { number_key: { $lte: 1 } } as PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>,
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const res = await testTable.getOneByParams(params);

							assert.equal(res.one?.number_key, 1);
						},
					);
				}

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"CRUD",
			async (testContext) => {
				let id = "";
				const initialParams = {
					description: "description",
					meta: { firstName: "firstName", lastName: "lastName" },
					number_key: 1,
					number_range: "[100,201)",
					title: "title",
				};
				const updatedParams = {
					description: "description updated",
					meta: { firstName: "firstName updated", lastName: "lastName updated" },
					number_key: 2,
					number_range: "[200,301)",
					title: "title updated",
				};

				{
					await testContext.test(
						"create createOne",
						async () => {
							const entity = await testTable.createOne(initialParams);

							id = entity.id;

							assert.equal(entity.description, initialParams.description);
							assert.equal(entity.meta.firstName, initialParams.meta.firstName);
							assert.equal(entity.meta.lastName, initialParams.meta.lastName);
							assert.equal(entity.number_key, initialParams.number_key);
							assert.equal(entity.number_range, initialParams.number_range);
							assert.equal(entity.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByPk",
						async () => {
							const { one } = await testTable.getOneByPk(id);

							assert.equal(one?.description, initialParams.description);
							assert.equal(one?.meta.firstName, initialParams.meta.firstName);
							assert.equal(one?.meta.lastName, initialParams.meta.lastName);
							assert.equal(one?.number_key, initialParams.number_key);
							assert.equal(one?.number_range, initialParams.number_range);
							assert.equal(one?.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one } = await testTable.getOneByParams({ params: { id } });

							assert.equal(one?.description, initialParams.description);
							assert.equal(one?.meta.firstName, initialParams.meta.firstName);
							assert.equal(one?.meta.lastName, initialParams.meta.lastName);
							assert.equal(one?.number_key, initialParams.number_key);
							assert.equal(one?.number_range, initialParams.number_range);
							assert.equal(one?.title, initialParams.title);
						},
					);
				}

				{
					await testContext.test(
						"update updateOneByPk",
						async () => {
							const entity = await testTable.updateOneByPk(id, updatedParams);

							assert.equal(entity.description, updatedParams.description);
							assert.equal(entity.meta.firstName, updatedParams.meta.firstName);
							assert.equal(entity.meta.lastName, updatedParams.meta.lastName);
							assert.equal(entity.number_key, updatedParams.number_key);
							assert.equal(entity.number_range, updatedParams.number_range);
							assert.equal(entity.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one: entity } = await testTable.getOneByParams({ params: { id } });

							assert.equal(entity?.description, updatedParams.description);
							assert.equal(entity?.meta.firstName, updatedParams.meta.firstName);
							assert.equal(entity?.meta.lastName, updatedParams.meta.lastName);
							assert.equal(entity?.number_key, updatedParams.number_key);
							assert.equal(entity?.number_range, updatedParams.number_range);
							assert.equal(entity?.title, updatedParams.title);
						},
					);
				}

				{
					await testContext.test(
						"delete deleteOneByPk",
						async () => {
							const entityId = await testTable.deleteOneByPk(id);

							assert.equal(entityId, id);
						},
					);
				}

				{
					await testContext.test(
						"read getOneByParams",
						async () => {
							const { one } = await testTable.getOneByParams({ params: { id } });

							assert.equal(one, undefined);
						},
					);
				}

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"deleteByParams",
			async () => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				await testTable.deleteByParams({ params: { number_key: { $gte: 4 } } });

				const res = await testTable.getArrByParams({ params: {} });

				assert.equal(res.length, 3);

				await testTable.deleteAll();
			},
		);

		await testContext.test(
			"deleteByParams",
			async () => {
				await Promise.all([1, 2, 3, 4, 5].map((e) => {
					const params = {
						description: `description ${e}`,
						meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
						number_key: e,
						number_range: `[${e}00,${++e}01)`,
						title: `title ${e}`,
					};

					return testTable.createOne(params);
				}));

				await testTable.updateByParams(
					{ params: { number_key: { $gte: 4 } } },
					{ title: "title updated" },
				);

				const res = await testTable.getArrByParams({ params: { title: "title updated" } });

				assert.equal(res.length, 2);

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
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${testTable.tableName};`);
			},
		);

		await testContext.test(
			"remove pools",
			async () => {
				await PG.BaseModel.removeStandardPool(creds);
				await PG.BaseModel.removeTransactionPool(creds);
			},
		);
	});
};
