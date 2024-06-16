import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as UserRoleTable from "./user-role/index.js";
import * as UserTable from "./user/index.js";

export const start = async (creds: PG.ModelTypes.TDBCreds) => {
	const User = new UserTable.Domain(creds);
	const UserRole = new UserRoleTable.Domain(creds);

	return test("PG-04", async (testContext) => {
		await testContext.test(
			"create tables",
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

					    first_name                      TEXT,
					    last_name                       TEXT,

					    deleted_at                      TIMESTAMP WITH TIME ZONE,
					    is_deleted                      BOOLEAN NOT NULL DEFAULT FALSE,

					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE,

					    CONSTRAINT users_user_roles_id_user_role_fk
					        FOREIGN KEY(id_user_role)
					            REFERENCES ${UserRole.tableName}(id)
					);
				`);
			},
		);

		await testContext.test(
			"queryBuilder",
			async (testContext) => {
				{
					await testContext.test(
						"create admin user",
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
						"create head user",
						async () => {
							const { one: userRole } = await UserRole.getOneByParams({
								params: { title: "head" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role head not found");

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

							const firstNames = ["John", "Mary", "Peter", "Max", "Ann"];

							const users = await User.model.queryBuilder()
								.insert<UserTable.Types.CreateFields>({
									params: firstNames.map((e) => ({ first_name: e, id_user_role: userRole.id })),
								})
								.returning(["id"])
								.execute<{ id: string; }>();

							assert.equal(users.length, 5);
						},
					);

					{
						await testContext.test(
							"select",
							async () => {
								const users = await User.getAll();
								const firstUser = users.at(0);

								assert.equal(users.length, 7);
								assert.equal(typeof firstUser?.id, "string");
								assert.equal(typeof firstUser?.id_user_role, "string");
								assert.equal(typeof firstUser?.is_deleted, "boolean");
								assert.equal(typeof firstUser?.first_name, "string");
								assert.equal(firstUser?.last_name, null);
								assert.equal(typeof firstUser?.created_at, "object");
								assert.equal(firstUser?.updated_at, null);
							},
						);
					}

					{
						await testContext.test(
							"select + where",
							async () => {
								const users = await User.getAllNotDeletedWithRole();
								const firstUser = users.at(0);

								assert.equal(users.length, 7);
								assert.equal(typeof firstUser?.id, "string");
								assert.equal(typeof firstUser?.id_user_role, "string");
								assert.equal(typeof firstUser?.is_deleted, "boolean");
								assert.equal(typeof firstUser?.first_name, "string");
								assert.equal(firstUser?.last_name, null);
								assert.equal(typeof firstUser?.created_at, "object");
								assert.equal(firstUser?.updated_at, null);
							},
						);
					}

					{
						await testContext.test(
							"select + where + second",
							async () => {
								const users = await User.model.queryBuilder()
									.select(["id"])
									.where({ params: {} })
									.execute<{ id: string; }>();

								{
									await User.model.queryBuilder()
										.select(["*"])
										.where({
											params: {
												first_name: { $ilike: "Max" },
												id: { $in: users.map((e) => e.id) },
												is_deleted: false,
											},
										})
										.execute();
								}

								{
									await User.model.queryBuilder()
										.select(["*"])
										.where({
											params: {
												first_name: { $ilike: "Max" },
												id: { $nin: users.map((e) => e.id) },
												is_deleted: false,
											},
										})
										.execute();
								}
							},
						);
					}

					{
						await testContext.test(
							"User.getList",
							async () => {
								const users = await User.getList({
									order: [{ column: "u.created_at", sorting: "ASC" }],
									pagination: { limit: 10, offset: 0 },
									params: {},
								});

								assert.equal(users.length, 7);
							},
						);
					}

					{
						await testContext.test(
							"User.getListAndCount",
							async () => {
								const [list, count] = await User.getListAndCount({
									order: [{ column: "u.created_at", sorting: "ASC" }],
									pagination: { limit: 10, offset: 0 },
									params: {},
								});

								assert.equal(list.length, 7);
								assert.equal(count, 7);
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy",
							async () => {
								const users = await User.getAllWithTitleUser();

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
							"select + rightJoin + where + orderBy + pagination",
							async () => {
								const users = await User.getAllWithTitleUserWithPagination();

								assert.equal(users.length, 3);

								const firstUser = users.at(0);

								assert.equal(firstUser?.first_name, "John");
								assert.equal(firstUser?.ur_title, "user");

								const lastUser = users.at(-1);

								assert.equal(lastUser?.first_name, "Max");
								assert.equal(lastUser?.ur_title, "user");
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy + groupBy",
							async () => {
								const stat = await User.getCountByUserRolesTitle();

								assert.equal(stat.length, 3);

								const firstEl = stat.at(0);

								assert.equal(firstEl?.title, "admin");
								assert.equal(firstEl?.users_count, "1");

								const secondEl = stat.at(1);

								assert.equal(secondEl?.title, "head");
								assert.equal(secondEl?.users_count, "1");

								const thirdEl = stat.at(2);

								assert.equal(thirdEl?.title, "user");
								assert.equal(thirdEl?.users_count, "5");
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy + groupBy + having",
							async () => {
								const stat = await User.getCountByUserRolesTitleWithCountGte5();

								assert.equal(stat.length, 1);

								const firstEl = stat.at(0);

								assert.equal(firstEl?.title, "user");
								assert.equal(firstEl?.users_count, "5");
							},
						);
					}
					await User.deleteAll();
				}
			},
		);

		await testContext.test(
			"dropTable",
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
