import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { PG } from "../index.js";

import * as Helpers from "../helpers.js";

import * as UserRoleTable from "./user-role/index.js";
import * as UserTable from "./user/index.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: PG.ModelTypes.TDBCreds) => {
	const User = new UserTable.Domain(creds);
	const UserRole = new UserRoleTable.Domain(creds);

	return test("PG-" + TEST_NAME, async (testContext) => {
		await testContext.test(
			"Helpers.migrationsUp",
			async () => { await Helpers.migrationsUp(creds, TEST_NAME); },
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
									isUseDefaultValues: true,
									params: firstNames.map((e) => ({
										first_name: e,
										id_user_role: userRole.id,
										last_name: undefined,
									})),
									updateColumn: { title: "updated_at", type: "timestamp" },
								})
								.returning(["id"])
								.execute<{ id: string; }>();

							assert.strictEqual(users.length, firstNames.length);
						},
					);

					{
						await testContext.test(
							"select",
							async () => {
								const users = await User.getAll();
								const firstUser = users.at(0);

								if (!firstUser) throw new Error("FirstUser not found");

								assert.strictEqual(users.length, 7);
								assert.strictEqual(typeof firstUser.id, "string");
								assert.strictEqual(typeof firstUser.id_user_role, "string");
								assert.strictEqual(typeof firstUser.is_deleted, "boolean");
								assert.strictEqual(typeof firstUser.first_name, "string");
								assert.strictEqual(firstUser.last_name, null);
								assert.strictEqual(typeof firstUser.created_at, "object");
								assert.strictEqual(firstUser.updated_at, null);
							},
						);
					}

					{
						await testContext.test(
							"select + where",
							async () => {
								const users = await User.getAllNotDeletedWithRole();
								const firstUser = users.at(0);

								if (!firstUser) throw new Error("FirstUser not found");

								assert.strictEqual(users.length, 7);
								assert.strictEqual(typeof firstUser.id, "string");
								assert.strictEqual(typeof firstUser.id_user_role, "string");
								assert.strictEqual(typeof firstUser.is_deleted, "boolean");
								assert.strictEqual(typeof firstUser.first_name, "string");
								assert.strictEqual(firstUser.last_name, null);
								assert.strictEqual(typeof firstUser.created_at, "object");
								assert.strictEqual(firstUser.updated_at, null);
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
										.where<UserTable.Types.TableFields>({
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

								assert.strictEqual(users.length, 7);
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

								assert.strictEqual(list.length, 7);
								assert.strictEqual(count, 7);
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy",
							async () => {
								const users = await User.getAllWithTitleUser();

								assert.strictEqual(users.length, 5);

								const firstUser = users.at(0);

								assert.strictEqual(firstUser?.first_name, "Ann");
								assert.strictEqual(firstUser?.ur_title, "user");

								const lastUser = users.at(-1);

								assert.strictEqual(lastUser?.first_name, "Peter");
								assert.strictEqual(lastUser?.ur_title, "user");
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy + pagination",
							async () => {
								const users = await User.getAllWithTitleUserWithPagination();

								assert.strictEqual(users.length, 3);

								const firstUser = users.at(0);

								assert.strictEqual(firstUser?.first_name, "John");
								assert.strictEqual(firstUser?.ur_title, "user");

								const lastUser = users.at(-1);

								assert.strictEqual(lastUser?.first_name, "Max");
								assert.strictEqual(lastUser?.ur_title, "user");
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy + groupBy",
							async () => {
								const stat = await User.getCountByUserRolesTitle();

								assert.strictEqual(stat.length, 3);

								const firstEl = stat.at(0);

								assert.strictEqual(firstEl?.title, "admin");
								assert.strictEqual(firstEl?.users_count, "1");

								const secondEl = stat.at(1);

								assert.strictEqual(secondEl?.title, "head");
								assert.strictEqual(secondEl?.users_count, "1");

								const thirdEl = stat.at(2);

								assert.strictEqual(thirdEl?.title, "user");
								assert.strictEqual(thirdEl?.users_count, "5");
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy + groupBy + having",
							async () => {
								const stat = await User.getCountByUserRolesTitleWithCountGte5();

								assert.strictEqual(stat.length, 1);

								const firstEl = stat.at(0);

								assert.strictEqual(firstEl?.title, "user");
								assert.strictEqual(firstEl?.users_count, "5");
							},
						);
					}
					await User.deleteAll();
				}
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
