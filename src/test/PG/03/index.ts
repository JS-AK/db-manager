import assert from "node:assert";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import test from "node:test";

import { PG } from "../index.js";

import * as Helpers from "../helpers.js";

import { RepositoryManager } from "./data-access-layer/repository-manager.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: PG.ModelTypes.TDBCreds): Promise<void> => {
	await test("PG-" + TEST_NAME, async (testContext) => {
		const repositoryManager = new RepositoryManager(creds);

		await repositoryManager.init();

		const userRepository = repositoryManager.repository.user;
		const userRoleRepository = repositoryManager.repository.userRole;

		await testContext.test(
			"Helpers.migrationsUp",
			async () => { await Helpers.migrationsUp(creds, TEST_NAME); },
		);

		await testContext.test(
			"CRUD",
			async (testContext) => {
				{
					await testContext.test(
						"create admin",
						async () => {
							const { one: userRole } = await userRoleRepository.getOneByParams({
								params: { title: "admin" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["Robin"].map((e) =>
									userRepository.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					await testContext.test(
						"create head",
						async () => {
							const { one: userRole } = await userRoleRepository.getOneByParams({
								params: { title: "head" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["Bob"].map((e) =>
									userRepository.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					await testContext.test(
						"create users",
						async () => {
							const { one: userRole } = await userRoleRepository.getOneByParams({
								params: { title: "user" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["John", "Mary", "Peter", "Max", "Ann"].map((e) =>
									userRepository.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					{
						await testContext.test(
							"read admins getList",
							async () => {
								const users = await userRepository.getList({
									order: [{ column: "users.first_name", sorting: "ASC" }],
									params: { "user_roles.title": "admin" },
								});

								assert.strictEqual(users.length, 1);

								const firstUser = users.at(0);

								assert.strictEqual(firstUser?.first_name, "Robin");
								assert.strictEqual(firstUser?.user_role_title, "admin");
							},
						);
					}

					{
						await testContext.test(
							"read heads getList",
							async () => {
								const users = await userRepository.getList({
									order: [{ column: "users.first_name", sorting: "ASC" }],
									params: { "user_roles.title": "head" },
								});

								assert.strictEqual(users.length, 1);

								const firstUser = users.at(0);

								assert.strictEqual(firstUser?.first_name, "Bob");
								assert.strictEqual(firstUser?.user_role_title, "head");
							},
						);
					}

					{
						await testContext.test(
							"read users getList",
							async () => {
								const users = await userRepository.getList({
									order: [{ column: "users.first_name", sorting: "ASC" }],
									params: { "user_roles.title": "user" },
								});

								assert.strictEqual(users.length, 5);

								const firstUser = users.at(0);

								assert.strictEqual(firstUser?.first_name, "Ann");
								assert.strictEqual(firstUser?.user_role_title, "user");

								const lastUser = users.at(-1);

								assert.strictEqual(lastUser?.first_name, "Peter");
								assert.strictEqual(lastUser?.user_role_title, "user");
							},
						);
					}

					{
						await testContext.test(
							"update",
							async () => {
								const { one: userRole } = await userRoleRepository.getOneByParams({
									params: { title: "admin" },
									selected: ["id"],
								});

								if (!userRole) throw new Error("User role not found");

								const { one: userInitial } = await userRepository.getOneByParams({
									params: { id_user_role: userRole.id },
									selected: ["first_name", "id"],
								});

								if (!userInitial) throw new Error("User not found");

								const res = await userRepository.updateOneByPk(userInitial.id, {
									last_name: "Brown",
								});

								assert.strictEqual(res?.id, userInitial.id);
								assert.strictEqual(res?.first_name, userInitial.first_name);
								assert.strictEqual(res?.last_name, "Brown");

								const { one: userUpdated } = await userRepository.getOneByParams({
									params: { id_user_role: userRole.id },
									selected: ["first_name", "id", "last_name"],
								});

								assert.strictEqual(userUpdated?.id, userInitial.id);
								assert.strictEqual(userUpdated?.first_name, userInitial.first_name);
								assert.strictEqual(userUpdated?.last_name, "Brown");
							},
						);
					}

					await userRepository.deleteAll();
				}
			},
		);

		await testContext.test(
			"CRUD 2",
			async (testContext) => {
				{
					await testContext.test(
						"create admin",
						async () => {
							const { one: userRole } = await userRoleRepository.getOneByParams({ params: { title: "admin" }, selected: ["id"] });

							if (!userRole) throw new Error("User role not found");

							const createdUser = await userRepository.createOne({ first_name: "Robin", id_user_role: userRole.id }, { returningFields: ["first_name"] });

							assert.strictEqual(createdUser?.first_name, "Robin");
						},
					);

					{
						await testContext.test(
							"read admins getList",
							async () => {
								const users = await userRepository.getList({
									order: [{ column: "users.first_name", sorting: "ASC" }],
									params: { "user_roles.title": "admin" },
								});

								assert.strictEqual(users.length, 1);

								const firstUser = users.at(0);

								assert.strictEqual(firstUser?.first_name, "Robin");
								assert.strictEqual(firstUser?.user_role_title, "admin");
							},
						);
					}

					{
						await testContext.test(
							"read admins streamArrByParams",
							async () => {
								const stream = await userRepository.streamArrByParams({
									params: { first_name: "Robin" },
									selected: ["id", "first_name"],
								});

								const streamedRows: { id: string; first_name: string; }[] = [];

								await new Promise<void>((resolve, reject) => {
									stream.on("data", (row) => {
										streamedRows.push(row);
									});
									stream.on("end", () => {
										try {
											assert.strictEqual(streamedRows.length, 1);
											const [head] = streamedRows;

											if (!head) throw new Error("Streamed head user not found");
											assert.strictEqual(head.first_name, "Robin");
											resolve();
										} catch (err) {
											reject(err);
										}
									});
									stream.on("error", (err) => {
										reject(err);
									});
								});
							},
						);
					}

					{
						await testContext.test(
							"update",
							async () => {
								const { one: userRole } = await userRoleRepository.getOneByParams({ params: { title: "admin" }, selected: ["id"] });

								if (!userRole) throw new Error("User role not found");

								const { one: userInitial } = await userRepository.getOneByParams({ params: { id_user_role: userRole.id }, selected: ["first_name", "id"] });

								if (!userInitial) throw new Error("User not found");

								{
									const updatedUser = await userRepository.updateOneByPk(userInitial.id, { last_name: "Brown" }, { returningFields: ["id", "first_name", "last_name"] });

									assert.strictEqual(updatedUser?.id, userInitial.id);
									assert.strictEqual(updatedUser?.first_name, userInitial.first_name);
									assert.strictEqual(updatedUser?.last_name, "Brown");
								}

								{
									const { one: updatedUser } = await userRepository.getOneByParams({ params: { id_user_role: userRole.id }, selected: ["first_name", "id", "last_name"] });

									assert.strictEqual(updatedUser?.id, userInitial.id);
									assert.strictEqual(updatedUser?.first_name, userInitial.first_name);
									assert.strictEqual(updatedUser?.last_name, "Brown");
								}

								{
									const [updatedUser] = await userRepository.updateByParams({ params: { id: userInitial.id }, returningFields: ["id", "first_name", "last_name"] }, { last_name: "Brown" });

									assert.strictEqual(updatedUser?.id, userInitial.id);
									assert.strictEqual(updatedUser?.first_name, userInitial.first_name);
									assert.strictEqual(updatedUser?.last_name, "Brown");
								}

								{
									const { one: updatedUser } = await userRepository.getOneByParams({ params: { id_user_role: userRole.id }, selected: ["first_name", "id", "last_name"] });

									assert.strictEqual(updatedUser?.id, userInitial.id);
									assert.strictEqual(updatedUser?.first_name, userInitial.first_name);
									assert.strictEqual(updatedUser?.last_name, "Brown");
								}
							},
						);
					}

					await userRepository.deleteAll();
				}
			},
		);

		await testContext.test(
			"CRUD in transaction",
			async () => {
				const transactionPool = PG.BaseModel.getTransactionPool(creds);
				const client = await transactionPool.connect();

				try {
					await client.query("BEGIN");

					{
						const [userRole] = await userRoleRepository.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "admin" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const [userCreated] = await userRepository.model.queryBuilder({ client })
							.insert({ params: { first_name: "Robin admin", id_user_role: userRole.id } })
							.returning(["id"])
							.execute();

						if (!userCreated) throw new Error("User not create");

						assert.strictEqual(typeof userCreated.id, "string");
					}

					{
						const [userRole] = await userRoleRepository.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "head" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const [userCreated] = await userRepository.create(
							{ first_name: "Bob head", id_user_role: userRole.id },
							client,
						);

						if (!userCreated) throw new Error("User not create");

						assert.strictEqual(typeof userCreated.id, "string");
					}

					{
						const [userRole] = await userRoleRepository.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "user" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const firstNames = ["John", "Mary", "Peter", "Max", "Ann"];

						const users = await userRepository.create(
							firstNames.map((e) => ({ first_name: e, id_user_role: userRole.id })),
							client,
						);

						assert.strictEqual(users.length, 5);
					}

					{
						const admins = await userRepository.model.queryBuilder({ client, tableName: "users u" })
							.select([
								"u.id         AS id",
								"u.first_name AS first_name",
								"ur.id        AS ur_id",
								"ur.title     AS ur_title",
							])
							.innerJoin({
								initialField: "id_user_role",
								targetField: "id",
								targetTableName: "user_roles",
								targetTableNameAs: "ur",
							})
							.where({ params: { "ur.title": "admin" } })
							.orderBy([{ column: "u.first_name", sorting: "ASC" }])
							.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

						const [admin] = admins;

						assert.strictEqual(admins.length, 1);
						assert.strictEqual(admin?.first_name, "Robin admin");
						assert.strictEqual(admin?.ur_title, "admin");
					}

					{
						const heads = await userRepository.model.queryBuilder({ client, tableName: "users u" })
							.select([
								"u.id         AS id",
								"u.first_name AS first_name",
								"ur.id        AS ur_id",
								"ur.title     AS ur_title",
							])
							.innerJoin({
								initialField: "id_user_role",
								targetField: "id",
								targetTableName: "user_roles",
								targetTableNameAs: "ur",
							})
							.where({ params: { "ur.title": "head" } })
							.orderBy([{ column: "u.first_name", sorting: "ASC" }])
							.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

						const [head] = heads;

						assert.strictEqual(heads.length, 1);
						assert.strictEqual(head?.first_name, "Bob head");
						assert.strictEqual(head?.ur_title, "head");
					}

					{
						const stream = await userRepository.model.queryBuilder({ client, tableName: "users u" })
							.select([
								"u.id         AS id",
								"u.first_name AS first_name",
								"ur.id        AS ur_id",
								"ur.title     AS ur_title",
							])
							.innerJoin({
								initialField: "id_user_role",
								targetField: "id",
								targetTableName: "user_roles",
								targetTableNameAs: "ur",
							})
							.where({ params: { "ur.title": "head" } })
							.orderBy([{ column: "u.first_name", sorting: "ASC" }])
							.executeQueryStream<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

						const streamedRows: { id: string; first_name: string; ur_id: string; ur_title: string; }[] = [];

						await new Promise<void>((resolve, reject) => {
							stream.on("data", (row) => {
								streamedRows.push(row);
							});
							stream.on("end", () => {
								try {
									assert.strictEqual(streamedRows.length, 1);
									const [head] = streamedRows;

									if (!head) throw new Error("Streamed head user not found");
									assert.strictEqual(head.first_name, "Bob head");
									assert.strictEqual(head.ur_title, "head");
									resolve();
								} catch (err) {
									reject(err);
								}
							});
							stream.on("error", (err) => {
								reject(err);
							});
						});
					}

					{
						const users = await userRepository
							.model
							.queryBuilder({ client, tableName: "users u" })
							.select([
								"u.id         AS id",
								"u.first_name AS first_name",
								"ur.id        AS ur_id",
								"ur.title     AS ur_title",
							])
							.innerJoin({
								initialField: "id_user_role",
								targetField: "id",
								targetTableName: "user_roles",
								targetTableNameAs: "ur",
							})
							.where({ params: { "ur.title": "user" } })
							.orderBy([{ column: "u.first_name", sorting: "ASC" }])
							.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

						const firstUser = users.at(0);
						const lastUser = users.at(-1);

						assert.strictEqual(users.length, 5);
						assert.strictEqual(firstUser?.first_name, "Ann");
						assert.strictEqual(firstUser?.ur_title, "user");
						assert.strictEqual(lastUser?.first_name, "Peter");
						assert.strictEqual(lastUser?.ur_title, "user");
					}

					{
						const [userRole] = await userRoleRepository.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "admin" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const [userInitial] = await userRepository.model.queryBuilder({ client })
							.select(["id", "first_name"])
							.where({ params: { id_user_role: userRole.id } })
							.execute<{ id: string; first_name: string; }>();

						if (!userInitial) throw new Error("User not found");

						{
							const [userUpdated] = await userRepository.model.queryBuilder({ client })
								.update({
									params: { last_name: "Brown" },
									updateColumn: { title: "updated_at", type: "unix_timestamp" },
								})
								.where({ params: { id: userInitial.id } })
								.returning(["id", "first_name", "last_name"])
								.execute<{ id: string; first_name: string; last_name: string; }>();

							if (!userUpdated) throw new Error("userUpdated not found");

							assert.strictEqual(userUpdated.id, userInitial.id);
							assert.strictEqual(userUpdated.first_name, userInitial.first_name);
							assert.strictEqual(userUpdated.last_name, "Brown");
						}

						{
							const [userUpdated] = await userRepository.model.queryBuilder({ client })
								.select(["id", "first_name", "last_name"])
								.where({ params: { id_user_role: userRole.id } })
								.execute<{ id: string; first_name: string; last_name: string; }>();

							if (!userUpdated) throw new Error("userUpdated not found");

							assert.strictEqual(userUpdated.id, userInitial.id);
							assert.strictEqual(userUpdated.first_name, userInitial.first_name);
							assert.strictEqual(userUpdated.last_name, "Brown");
						}
					}

					await client.query("COMMIT");
				} catch (e) {
					await client.query("ROLLBACK");
					throw e;
				} finally {
					client.release();
				}

				await userRepository.deleteAll();
			},
		);

		await testContext.test(
			"CRUD in transaction PG.TransactionManager.execute success",
			async () => {
				await PG.TransactionManager.execute(
					async (client) => {
						{
							const [userRole] = await userRoleRepository.model.queryBuilder({ client })
								.select(["id"])
								.where({ params: { title: "admin" } })
								.execute<{ id: string; }>();

							if (!userRole) throw new Error("User role not found");

							const [userCreated] = await userRepository.model.queryBuilder({ client })
								.insert({ params: { first_name: "Robin admin", id_user_role: userRole.id } })
								.returning(["id"])
								.execute();

							if (!userCreated) throw new Error("User not create");

							assert.strictEqual(typeof userCreated.id, "string");
						}

						{
							const [userRole] = await userRoleRepository.model.queryBuilder({ client })
								.select(["id"])
								.where({ params: { title: "head" } })
								.execute<{ id: string; }>();

							if (!userRole) throw new Error("User role not found");

							const [userCreated] = await userRepository.create(
								{ first_name: "Bob head", id_user_role: userRole.id },
								client,
							);

							if (!userCreated) throw new Error("User not create");

							assert.strictEqual(typeof userCreated.id, "string");
						}

						{
							const [userRole] = await userRoleRepository.model.queryBuilder({ client })
								.select(["id"])
								.where({ params: { title: "user" } })
								.execute<{ id: string; }>();

							if (!userRole) throw new Error("User role not found");

							const firstNames = ["John", "Mary", "Peter", "Max", "Ann"];

							const users = await userRepository.create(
								firstNames.map((e) => ({ first_name: e, id_user_role: userRole.id })),
								client,
							);

							assert.strictEqual(users.length, 5);
						}

						{
							const admins = await userRepository.model.queryBuilder({ client, tableName: "users u" })
								.select([
									"u.id         AS id",
									"u.first_name AS first_name",
									"ur.id        AS ur_id",
									"ur.title     AS ur_title",
								])
								.innerJoin({
									initialField: "id_user_role",
									targetField: "id",
									targetTableName: "user_roles",
									targetTableNameAs: "ur",
								})
								.where({ params: { "ur.title": "admin" } })
								.orderBy([{ column: "u.first_name", sorting: "ASC" }])
								.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

							const [admin] = admins;

							assert.strictEqual(admins.length, 1);
							assert.strictEqual(admin?.first_name, "Robin admin");
							assert.strictEqual(admin?.ur_title, "admin");
						}

						{
							const heads = await userRepository.model.queryBuilder({ client, tableName: "users u" })
								.select([
									"u.id         AS id",
									"u.first_name AS first_name",
									"ur.id        AS ur_id",
									"ur.title     AS ur_title",
								])
								.innerJoin({
									initialField: "id_user_role",
									targetField: "id",
									targetTableName: "user_roles",
									targetTableNameAs: "ur",
								})
								.where({ params: { "ur.title": "head" } })
								.orderBy([{ column: "u.first_name", sorting: "ASC" }])
								.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

							const [head] = heads;

							assert.strictEqual(heads.length, 1);
							assert.strictEqual(head?.first_name, "Bob head");
							assert.strictEqual(head?.ur_title, "head");
						}

						{
							const users = await userRepository
								.model
								.queryBuilder({ client, tableName: "users u" })
								.select([
									"u.id         AS id",
									"u.first_name AS first_name",
									"ur.id        AS ur_id",
									"ur.title     AS ur_title",
								])
								.innerJoin({
									initialField: "id_user_role",
									targetField: "id",
									targetTableName: "user_roles",
									targetTableNameAs: "ur",
								})
								.where({ params: { "ur.title": "user" } })
								.orderBy([{ column: "u.first_name", sorting: "ASC" }])
								.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

							const firstUser = users.at(0);
							const lastUser = users.at(-1);

							assert.strictEqual(users.length, 5);
							assert.strictEqual(firstUser?.first_name, "Ann");
							assert.strictEqual(firstUser?.ur_title, "user");
							assert.strictEqual(lastUser?.first_name, "Peter");
							assert.strictEqual(lastUser?.ur_title, "user");
						}

						{
							const [userRole] = await userRoleRepository.model.queryBuilder({ client })
								.select(["id"])
								.where({ params: { title: "admin" } })
								.execute<{ id: string; }>();

							if (!userRole) throw new Error("User role not found");

							const [userInitial] = await userRepository.model.queryBuilder({ client })
								.select(["id", "first_name"])
								.where({ params: { id_user_role: userRole.id } })
								.execute<{ id: string; first_name: string; }>();

							if (!userInitial) throw new Error("User not found");

							{
								const [userUpdated] = await userRepository.model.queryBuilder({ client })
									.update({
										params: { last_name: "Brown" },
										updateColumn: { title: "updated_at", type: "unix_timestamp" },
									})
									.where({ params: { id: userInitial.id } })
									.returning(["id", "first_name", "last_name"])
									.execute<{ id: string; first_name: string; last_name: string; }>();

								if (!userUpdated) throw new Error("userUpdated not found");

								assert.strictEqual(userUpdated.id, userInitial.id);
								assert.strictEqual(userUpdated.first_name, userInitial.first_name);
								assert.strictEqual(userUpdated.last_name, "Brown");
							}

							{
								const [userUpdated] = await userRepository.model.queryBuilder({ client })
									.select(["id", "first_name", "last_name"])
									.where({ params: { id_user_role: userRole.id } })
									.execute<{ id: string; first_name: string; last_name: string; }>();

								if (!userUpdated) throw new Error("userUpdated not found");

								assert.strictEqual(userUpdated.id, userInitial.id);
								assert.strictEqual(userUpdated.first_name, userInitial.first_name);
								assert.strictEqual(userUpdated.last_name, "Brown");
							}
						}
					},
					{
						pool: PG.BaseModel.getTransactionPool(creds),
						timeToRollback: 10000,
					},
				);

				await userRepository.deleteAll();
			},
		);

		await testContext.test(
			"CRUD in transaction PG.TransactionManager.execute fail (timeToRollback)",
			async () => {
				const transactionId = crypto.randomUUID();

				await assert.rejects(
					async () => {
						await PG.TransactionManager.execute(
							async (client) => {
								{
									const [userRole] = await userRoleRepository.model.queryBuilder({ client })
										.select(["id"])
										.where({ params: { title: "admin" } })
										.execute<{ id: string; }>();

									if (!userRole) throw new Error("User role not found");

									const [userCreated] = await userRepository.model.queryBuilder({ client })
										.insert({ params: { first_name: "Robin admin", id_user_role: userRole.id } })
										.returning(["id"])
										.execute();

									if (!userCreated) throw new Error("User not create");

									assert.strictEqual(typeof userCreated.id, "string");
								}

								await setTimeout(100);

								{
									const [userRole] = await userRoleRepository.model.queryBuilder({ client })
										.select(["id"])
										.where({ params: { title: "head" } })
										.execute<{ id: string; }>();

									if (!userRole) throw new Error("User role not found");

									const [userCreated] = await userRepository.create(
										{ first_name: "Bob head", id_user_role: userRole.id },
										client,
									);

									if (!userCreated) throw new Error("User not create");

									assert.strictEqual(typeof userCreated.id, "string");
								}

								await setTimeout(100);

								{
									const [userRole] = await userRoleRepository.model.queryBuilder({ client })
										.select(["id"])
										.where({ params: { title: "user" } })
										.execute<{ id: string; }>();

									if (!userRole) throw new Error("User role not found");

									const firstNames = ["John", "Mary", "Peter", "Max", "Ann"];

									const users = await userRepository.create(
										firstNames.map((e) => ({ first_name: e, id_user_role: userRole.id })),
										client,
									);

									assert.strictEqual(users.length, 5);
								}

								await setTimeout(100);

								{
									const admins = await userRepository.model.queryBuilder({ client, tableName: "users u" })
										.select([
											"u.id         AS id",
											"u.first_name AS first_name",
											"ur.id        AS ur_id",
											"ur.title     AS ur_title",
										])
										.innerJoin({
											initialField: "id_user_role",
											targetField: "id",
											targetTableName: "user_roles",
											targetTableNameAs: "ur",
										})
										.where({ params: { "ur.title": "admin" } })
										.orderBy([{ column: "u.first_name", sorting: "ASC" }])
										.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

									const [admin] = admins;

									assert.strictEqual(admins.length, 1);
									assert.strictEqual(admin?.first_name, "Robin admin");
									assert.strictEqual(admin?.ur_title, "admin");
								}

								await setTimeout(100);

								{
									const heads = await userRepository.model.queryBuilder({ client, tableName: "users u" })
										.select([
											"u.id         AS id",
											"u.first_name AS first_name",
											"ur.id        AS ur_id",
											"ur.title     AS ur_title",
										])
										.innerJoin({
											initialField: "id_user_role",
											targetField: "id",
											targetTableName: "user_roles",
											targetTableNameAs: "ur",
										})
										.where({ params: { "ur.title": "head" } })
										.orderBy([{ column: "u.first_name", sorting: "ASC" }])
										.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

									const [head] = heads;

									assert.strictEqual(heads.length, 1);
									assert.strictEqual(head?.first_name, "Bob head");
									assert.strictEqual(head?.ur_title, "head");
								}

								await setTimeout(100);

								{
									const users = await userRepository
										.model
										.queryBuilder({ client, tableName: "users u" })
										.select([
											"u.id         AS id",
											"u.first_name AS first_name",
											"ur.id        AS ur_id",
											"ur.title     AS ur_title",
										])
										.innerJoin({
											initialField: "id_user_role",
											targetField: "id",
											targetTableName: "user_roles",
											targetTableNameAs: "ur",
										})
										.where({ params: { "ur.title": "user" } })
										.orderBy([{ column: "u.first_name", sorting: "ASC" }])
										.execute<{ id: string; first_name: string; ur_id: string; ur_title: string; }>();

									const firstUser = users.at(0);
									const lastUser = users.at(-1);

									assert.strictEqual(users.length, 5);
									assert.strictEqual(firstUser?.first_name, "Ann");
									assert.strictEqual(firstUser?.ur_title, "user");
									assert.strictEqual(lastUser?.first_name, "Peter");
									assert.strictEqual(lastUser?.ur_title, "user");
								}

								await setTimeout(100);

								{
									const [userRole] = await userRoleRepository.model.queryBuilder({ client })
										.select(["id"])
										.where({ params: { title: "admin" } })
										.execute<{ id: string; }>();

									if (!userRole) throw new Error("User role not found");

									const [userInitial] = await userRepository.model.queryBuilder({ client })
										.select(["id", "first_name"])
										.where({ params: { id_user_role: userRole.id } })
										.execute<{ id: string; first_name: string; }>();

									if (!userInitial) throw new Error("User not found");

									{
										const [userUpdated] = await userRepository.model.queryBuilder({ client })
											.update({
												params: { last_name: "Brown" },
												updateColumn: { title: "updated_at", type: "unix_timestamp" },
											})
											.where({ params: { id: userInitial.id } })
											.returning(["id", "first_name", "last_name"])
											.execute<{ id: string; first_name: string; last_name: string; }>();

										if (!userUpdated) throw new Error("userUpdated not found");

										assert.strictEqual(userUpdated.id, userInitial.id);
										assert.strictEqual(userUpdated.first_name, userInitial.first_name);
										assert.strictEqual(userUpdated.last_name, "Brown");
									}

									{
										const [userUpdated] = await userRepository.model.queryBuilder({ client })
											.select(["id", "first_name", "last_name"])
											.where({ params: { id_user_role: userRole.id } })
											.execute<{ id: string; first_name: string; last_name: string; }>();

										if (!userUpdated) throw new Error("userUpdated not found");

										assert.strictEqual(userUpdated.id, userInitial.id);
										assert.strictEqual(userUpdated.first_name, userInitial.first_name);
										assert.strictEqual(userUpdated.last_name, "Brown");
									}
								}
							},
							{
								pool: PG.BaseModel.getTransactionPool(creds),
								timeToRollback: 500,
								transactionId,
							},
						);
					},
					(error: Error) => {
						assert.equal(error.name, "Error");
						assert.equal(error.message, `Transaction (${transactionId}) timed out`);

						return true;
					},
				);

				await userRepository.deleteAll();
			},
		);

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
