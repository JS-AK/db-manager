import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as UserRoleTable from "./user-role/index.js";
import * as UserTable from "./user/index.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

export default async () => {
	const User = new UserTable.Domain(creds);
	const UserRole = new UserRoleTable.Domain(creds);

	return test("PG-03", async (testContext) => {
		await testContext.test(
			"create table",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${UserRole.tableName} CASCADE;
					CREATE TABLE ${UserRole.tableName}(
					    id                              BIGSERIAL PRIMARY KEY,
					    title                           TEXT UNIQUE,
					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE
					);
					INSERT INTO ${UserRole.tableName} (title) VALUES ('admin'), ('head'), ('user');
				`);
				await pool.query(`
					DROP TABLE IF EXISTS ${User.tableName} CASCADE;

					CREATE TABLE ${User.tableName}(
					    id                              BIGSERIAL PRIMARY KEY,
					    id_user_role                    BIGINT,
					    is_deleted                      BOOLEAN NOT NULL DEFAULT FALSE,
					    first_name                      TEXT,
					    last_name                       TEXT,
					    created_at                      BIGINT DEFAULT ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)),
					    updated_at                      BIGINT,

					    CONSTRAINT users_user_roles_id_user_role_fk
					        FOREIGN KEY(id_user_role)
					            REFERENCES ${UserRole.tableName}(id)
					);
				`);
			},
		);

		await testContext.test(
			"CRUD",
			async (testContext) => {
				{
					await testContext.test(
						"create admin",
						async () => {
							const { one: userRole } = await UserRole.getOneByParams({
								params: { title: "admin" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["Robin"].map((e) =>
									User.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					await testContext.test(
						"create head",
						async () => {
							const { one: userRole } = await UserRole.getOneByParams({
								params: { title: "head" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["Bob"].map((e) =>
									User.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					await testContext.test(
						"create users",
						async () => {
							const { one: userRole } = await UserRole.getOneByParams({
								params: { title: "user" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["John", "Mary", "Peter", "Max", "Ann"].map((e) =>
									User.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					{
						await testContext.test(
							"read admins getList",
							async () => {
								const users = await User.getList({
									order: [{ orderBy: "u.first_name", ordering: "ASC" }],
									params: { "ur.title": "admin" },
								});

								assert.equal(users.length, 1);

								const firstUser = users.at(0);

								assert.equal(firstUser?.first_name, "Robin");
								assert.equal(firstUser?.ur_title, "admin");
							},
						);
					}

					{
						await testContext.test(
							"read heads getList",
							async () => {
								const users = await User.getList({
									order: [{ orderBy: "u.first_name", ordering: "ASC" }],
									params: { "ur.title": "head" },
								});

								assert.equal(users.length, 1);

								const firstUser = users.at(0);

								assert.equal(firstUser?.first_name, "Bob");
								assert.equal(firstUser?.ur_title, "head");
							},
						);
					}

					{
						await testContext.test(
							"read users getList",
							async () => {
								const users = await User.getList({
									order: [{ orderBy: "u.first_name", ordering: "ASC" }],
									params: { "ur.title": "user" },
								});

								assert.equal(users.length, 5);

								const firstUser = users.at(0);

								assert.equal(firstUser?.first_name, "Ann");
								assert.equal(firstUser?.ur_title, "user");

								const lastUser = users.at(-1);

								assert.equal(lastUser?.first_name, "Peter");
								assert.equal(lastUser?.ur_title, "user");
							},
						);
					}

					{
						await testContext.test(
							"update",
							async () => {
								const { one: userRole } = await UserRole.getOneByParams({
									params: { title: "admin" },
									selected: ["id"],
								});

								if (!userRole) throw new Error("User role not found");

								const { one: userInitial } = await User.getOneByParams({
									params: { id_user_role: userRole.id },
									selected: ["first_name", "id"],
								});

								if (!userInitial) throw new Error("User not found");

								const res = await User.updateOneByPk(userInitial.id, {
									last_name: "Brown",
								});

								assert.equal(res?.id, userInitial.id);
								assert.equal(res?.first_name, userInitial.first_name);
								assert.equal(res?.last_name, "Brown");

								const { one: userUpdated } = await User.getOneByParams({
									params: { id_user_role: userRole.id },
									selected: ["first_name", "id", "last_name"],
								});

								assert.equal(userUpdated?.id, userInitial.id);
								assert.equal(userUpdated?.first_name, userInitial.first_name);
								assert.equal(userUpdated?.last_name, "Brown");
							},
						);
					}

					await User.deleteAll();
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
							const { one: userRole } = await UserRole.getOneByParams({ params: { title: "admin" }, selected: ["id"] });

							if (!userRole) throw new Error("User role not found");

							const createdUser = await User.createOne({ first_name: "Robin", id_user_role: userRole.id }, { returningFields: ["first_name"] });

							assert.equal(createdUser?.first_name, "Robin");
						},
					);

					{
						await testContext.test(
							"read admins getList",
							async () => {
								const users = await User.getList({
									order: [{ orderBy: "u.first_name", ordering: "ASC" }],
									params: { "ur.title": "admin" },
								});

								assert.equal(users.length, 1);

								const firstUser = users.at(0);

								assert.equal(firstUser?.first_name, "Robin");
								assert.equal(firstUser?.ur_title, "admin");
							},
						);
					}

					{
						await testContext.test(
							"update",
							async () => {
								const { one: userRole } = await UserRole.getOneByParams({ params: { title: "admin" }, selected: ["id"] });

								if (!userRole) throw new Error("User role not found");

								const { one: userInitial } = await User.getOneByParams({ params: { id_user_role: userRole.id }, selected: ["first_name", "id"] });

								if (!userInitial) throw new Error("User not found");

								{
									const updatedUser = await User.updateOneByPk(userInitial.id, { last_name: "Brown" }, { returningFields: ["id", "first_name", "last_name"] });

									assert.equal(updatedUser?.id, userInitial.id);
									assert.equal(updatedUser?.first_name, userInitial.first_name);
									assert.equal(updatedUser?.last_name, "Brown");
								}

								{
									const { one: updatedUser } = await User.getOneByParams({ params: { id_user_role: userRole.id }, selected: ["first_name", "id", "last_name"] });

									assert.equal(updatedUser?.id, userInitial.id);
									assert.equal(updatedUser?.first_name, userInitial.first_name);
									assert.equal(updatedUser?.last_name, "Brown");
								}

								{
									const [updatedUser] = await User.updateByParams({ params: { id: userInitial.id }, returningFields: ["id", "first_name", "last_name"] }, { last_name: "Brown" });

									assert.equal(updatedUser?.id, userInitial.id);
									assert.equal(updatedUser?.first_name, userInitial.first_name);
									assert.equal(updatedUser?.last_name, "Brown");
								}

								{
									const { one: updatedUser } = await User.getOneByParams({ params: { id_user_role: userRole.id }, selected: ["first_name", "id", "last_name"] });

									assert.equal(updatedUser?.id, userInitial.id);
									assert.equal(updatedUser?.first_name, userInitial.first_name);
									assert.equal(updatedUser?.last_name, "Brown");
								}
							},
						);
					}

					await User.deleteAll();
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
						const [userRole] = await UserRole.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "admin" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const [userCreated] = await User.model.queryBuilder({ client })
							.insert({ params: { first_name: "Robin admin", id_user_role: userRole.id } })
							.returning(["id"])
							.execute();

						if (!userCreated) throw new Error("User not create");

						assert.equal(typeof userCreated.id, "string");
					}

					{
						const [userRole] = await UserRole.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "head" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const [userCreated] = await User.model.queryBuilder({ client })
							.insert<UserTable.Types.CreateFields>({ params: { first_name: "Bob head", id_user_role: userRole.id } })
							.returning(["id"])
							.execute<{ id: string; }>();

						if (!userCreated) throw new Error("User not create");

						assert.equal(typeof userCreated.id, "string");
					}

					{
						const [userRole] = await UserRole.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "user" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const firstNames = ["John", "Mary", "Peter", "Max", "Ann"];

						const users = await User.model.queryBuilder({ client })
							.insert<UserTable.Types.CreateFields>({
								params: firstNames.map((e) => ({ first_name: e, id_user_role: userRole.id })),
							})
							.returning(["id"])
							.execute<{ id: string; }>();

						assert.equal(users.length, 5);
					}

					{
						const admins = await User.model.queryBuilder({ client, tableName: "users u" })
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

						assert.equal(admins.length, 1);
						assert.equal(admin?.first_name, "Robin admin");
						assert.equal(admin?.ur_title, "admin");
					}

					{
						const heads = await User.model.queryBuilder({ client, tableName: "users u" })
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

						assert.equal(heads.length, 1);
						assert.equal(head?.first_name, "Bob head");
						assert.equal(head?.ur_title, "head");
					}

					{
						const users = await User
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

						assert.equal(users.length, 5);
						assert.equal(firstUser?.first_name, "Ann");
						assert.equal(firstUser?.ur_title, "user");
						assert.equal(lastUser?.first_name, "Peter");
						assert.equal(lastUser?.ur_title, "user");
					}

					{
						const [userRole] = await UserRole.model.queryBuilder({ client })
							.select(["id"])
							.where({ params: { title: "admin" } })
							.execute<{ id: string; }>();

						if (!userRole) throw new Error("User role not found");

						const [userInitial] = await User.model.queryBuilder({ client })
							.select(["id", "first_name"])
							.where({ params: { id_user_role: userRole.id } })
							.execute<{ id: string; first_name: string; }>();

						if (!userInitial) throw new Error("User not found");

						{
							const [userUpdated] = await User.model.queryBuilder({ client })
								.update({
									params: { last_name: "Brown" },
									updateColumn: { title: "updated_at", type: "unix_timestamp" },
								})
								.where({ params: { id: userInitial.id } })
								.returning(["id", "first_name", "last_name"])
								.execute<{ id: string; first_name: string; last_name: string; }>();

							if (!userUpdated) throw new Error("userUpdated not found");

							assert.equal(userUpdated.id, userInitial.id);
							assert.equal(userUpdated.first_name, userInitial.first_name);
							assert.equal(userUpdated.last_name, "Brown");
						}

						{
							const [userUpdated] = await User.model.queryBuilder({ client })
								.select(["id", "first_name", "last_name"])
								.where({ params: { id_user_role: userRole.id } })
								.execute<{ id: string; first_name: string; last_name: string; }>();

							if (!userUpdated) throw new Error("userUpdated not found");

							assert.equal(userUpdated.id, userInitial.id);
							assert.equal(userUpdated.first_name, userInitial.first_name);
							assert.equal(userUpdated.last_name, "Brown");
						}
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
			"drop tables",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${User.tableName};`);
				await pool.query(`DROP TABLE IF EXISTS ${UserRole.tableName};`);
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
