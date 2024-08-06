import assert from "node:assert";
import test from "node:test";

import { PG, Types } from "../../index.js";

import * as TestTable from "./test-table-01/index.js";
import { isHasFields } from "../../shared-helpers/index.js";

export const start = async (creds: PG.ModelTypes.TDBCreds) => {
	const testTable = new TestTable.Domain(creds);

	return test("PG-01", async (testContext) => {
		await testContext.test(
			"create table",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${testTable.tableName} CASCADE;

					CREATE TABLE ${testTable.tableName}(
					  id                              BIGSERIAL PRIMARY KEY,

					  books                           TEXT[],
					  description                     TEXT,
					  meta                            JSONB NOT NULL,
					  checklist                       JSONB[],
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
				await testTable.clearAll();
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

				await testTable.clearAll();
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

					const { query, values } = PG.BaseModel.getInsertFields<TestTable.Types.CreateFields, TestTable.Types.TableKeys>({
						params,
						returning: ["id"],
						tableName: testTable.tableName,
					});

					const { rows: [entity] } = (await client.query<{ id: string; }>(query, values));

					if (!entity) throw new Error("Entity not found");

					assert.equal(typeof entity.id, "string");

					{
						const params = [
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 10, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 11, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 12, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 13, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 14, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 15, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 16, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 17, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 18, title: "title" },
							{ meta: { firstName: "firstName", lastName: "lastName" }, number_key: 19, title: "title" },
						];

						const { query, values } = PG.BaseModel.getInsertFields<TestTable.Types.CreateFields, TestTable.Types.TableKeys>({
							params,
							returning: ["id", "number_key"],
							tableName: testTable.tableName,
						});

						const { rows: entities } = (await client.query<{ id: string; }>(query, values));

						assert.equal(entities.length, params.length);
					}

					{
						const { rows: [data] } = (await client.query<Pick<TestTable.Types.TableFields, "meta" | "title">>(`
							SELECT meta, title
							FROM ${testTable.tableName}
							WHERE id = $1
						`, [entity.id]));

						if (!data) throw new Error("Data not found");

						assert.equal(data.meta.firstName, params.meta.firstName);
						assert.equal(data.meta.lastName, params.meta.lastName);
						assert.equal(data.title, params.title);
					}

					{
						const paramsToUpdate = {
							meta: { firstName: "firstName updated", lastName: "lastName updated" },
							title: "title updated",
						};

						const { query, values } = PG.BaseModel.getUpdateFields<TestTable.Types.UpdateFields, TestTable.Types.TableKeys>({
							params: paramsToUpdate,
							primaryKey: { field: "id", value: entity.id },
							tableName: testTable.tableName,
							updateField: testTable.updateField,
						});

						await client.query(query, values);

						{
							const { rows: [data] } = (await client.query<Pick<TestTable.Types.TableFields, "meta" | "title">>(`
								SELECT meta, title
								FROM ${testTable.tableName}
								WHERE id = $1
							`, [entity.id]));

							if (!data) throw new Error("Data not found");

							assert.equal(data.meta.firstName, paramsToUpdate.meta.firstName);
							assert.equal(data.meta.lastName, paramsToUpdate.meta.lastName);
							assert.equal(data.title, paramsToUpdate.title);
						}
					}

					await client.query(`DELETE FROM ${testTable.tableName}`);

					{
						const { rows: [data] } = (await client.query<TestTable.Types.TableFields>(`
							SELECT *
							FROM ${testTable.tableName}
							WHERE id = $1
						`, [entity.id]));

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
				await testTable.createDefaultState();

				const count = await testTable.getCountByParams({ params: {} });

				assert.equal(count, 5);

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"getCountByPks",
			async () => {
				await testTable.createDefaultState();

				const ids = (await testTable.getArrByParams({ params: {} })).map((e) => e.id);
				const count = await testTable.getCountByPks(ids);

				assert.equal(count, 5);

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"getCountByPksAndParams",
			async () => {
				await testTable.createDefaultState();

				const ids = (await testTable.getArrByParams({ params: {} })).map((e) => e.id);
				const count = await testTable.getCountByPksAndParams(
					ids,
					{ params: { number_key: 1 } },
				);

				assert.equal(count, 1);

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"getArrByParams",
			async (testContext) => {
				await testTable.createDefaultState();

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);
							const [one] = result;

							if (!one) throw new Error("No one found");

							assert.equal(result.length, 5);
							assert.equal(isHasFields(one, testTable.tableFields), true);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
						selected: [TestTable.Types.TableKeys];
					} = {
						params: {},
						selected: ["number_key"],
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);
							const [one] = result;

							if (!one) throw new Error("No one found");

							assert.equal(result.length, 5);
							assert.equal(isHasFields(one, ["number_key"]), true);
							assert.equal(isHasFields(one, testTable.tableFields), false);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $between: [1, 2] } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 2);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_range: { $custom: { sign: "@>", value: "[150,151)" } } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 1);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $gt: 2 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 3);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $gte: 2 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 4);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $in: [1, 2] } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 2);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { description: { $like: "%description%" } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 5);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { description: { $ilike: "%DESCRIPTION%" } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 5);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $lt: 5 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 4);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $lte: 5 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 5);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $nbetween: [1, 2] } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 3);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $ne: 1 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 4);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $ne: null } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 5);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $nin: [1, 2] } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 3);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { description: { $nlike: "%description%" } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 0);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { description: { $nilike: "%DESCRIPTION%" } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 0);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
						paramsOr: PG.DomainTypes.TArray2OrMore<PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>>;
					} = {
						params: { number_key: { $in: [1, 2] } },
						paramsOr: [{ number_key: 1 }, { number_key: 2 }],
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 2);
						},
					);
				}

				{
					const params: {
						pagination: Types.TPagination;
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
						paramsOr: PG.DomainTypes.TArray2OrMore<PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>>;
					} = {
						pagination: { limit: 1, offset: 1 },
						params: { number_key: { $in: [1, 2] } },
						paramsOr: [{ number_key: 1 }, { number_key: 2 }],
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getArrByParams(params);

							assert.equal(result.length, 1);
						},
					);
				}

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"getOneByParams",
			async (testContext) => {
				await testTable.createDefaultState();

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: 1 },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
							assert.equal(isHasFields(one, testTable.tableFields), true);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
						selected: [TestTable.Types.TableKeys];
					} = {
						params: { number_key: 1 },
						selected: ["number_key"],
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams({
								params: params.params,
								selected: params.selected,
							});

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
							assert.equal(isHasFields(one, ["number_key"]), true);
							assert.equal(isHasFields(one, testTable.tableFields), false);
						},
					);
				}

				{
					const likeText = "description 5";
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { description: { $like: `%${likeText}%` } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.description, likeText);
						},
					);
				}

				{
					const likeText = "description 5";
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {
							books: { "$&&": ["book 05"] },
							description: [
								{ $like: `%${likeText}%` },
								{ $like: likeText },
								{ $nlike: "ABC" },
								{ $ne: null },
							],
							updated_at: null,
						},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.description, likeText);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $lt: 2 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: { number_key: { $lte: 1 } },
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {
							number_key: { $eq: 1 },
							updated_at: { $eq: null },
						},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {
							created_at: [
								{ $gt: new Date("2000-01-01") },
								{ $gte: new Date("2000-01-01") },
							],
							number_key: { $eq: 1 },
						},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {
							created_at: { $ne: null },
							number_key: { $eq: 1 },
						},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const { one } = await testTable.getOneByParams(params);

							if (!one) throw new Error("No one found");

							assert.equal(one.number_key, 1);
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {
							"meta->'firstName'": "\"firstName 1\"",
						},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getOneByParams(params);

							assert.equal(result.one?.meta.firstName, "firstName 1");
						},
					);
				}

				{
					const params: {
						params: PG.DomainTypes.TSearchParams<TestTable.Types.SearchFields>;
					} = {
						params: {
							books: { $eq: ["book 01", "book 11", "book 21", "book 31", "book 41"] },
							meta: { $jsonb: { firstName: "firstName 1", lastName: "lastName 1" } },
						},
					};

					await testContext.test(
						JSON.stringify(params),
						async () => {
							const result = await testTable.getOneByParams(params);

							assert.equal(result.one?.meta.firstName, "firstName 1");
							assert.equal(result.one?.meta.lastName, "lastName 1");
						},
					);
				}

				await testTable.clearAll();
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

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"deleteByParams",
			async () => {
				await testTable.createDefaultState();

				await testTable.deleteByParams({ params: { number_key: { $gte: 4 } } });

				const result = await testTable.getArrByParams({ params: {} });

				assert.equal(result.length, 3);

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"deleteByParams",
			async () => {
				await testTable.createDefaultState();

				await testTable.updateByParams(
					{ params: { number_key: { $gte: 4 } } },
					{ title: "title updated" },
				);

				const result = await testTable.getArrByParams({ params: { title: "title updated" } });

				assert.equal(result.length, 2);

				await testTable.clearAll();
			},
		);

		await testContext.test(
			"custom test function",
			async () => {
				const isNotFailed = await testTable.test();

				assert.equal(isNotFailed, true);
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
