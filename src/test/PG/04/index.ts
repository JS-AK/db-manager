import assert from "node:assert";
import { fileURLToPath } from "node:url";
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
			"queryBuilder",
			async (testContext) => {
				{
					await testContext.test(
						"create admin user",
						async () => {
							const { one: userRole } = await userRoleRepository.getOneByParams({
								params: { title: "admin" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role not found");

							await Promise.all(
								["Robin"].map((e) => userRepository.createOne({ first_name: e, id_user_role: userRole.id })),
							);
						},
					);

					await testContext.test(
						"create head user",
						async () => {
							const { one: userRole } = await userRoleRepository.getOneByParams({
								params: { title: "head" },
								selected: ["id"],
							});

							if (!userRole) throw new Error("User role head not found");

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

							const firstNames = ["John", "Mary", "Peter", "Max", "Ann"];

							const users = await userRepository.create(firstNames.map((e) => ({
								first_name: e,
								id_user_role: userRole.id,
							})));

							assert.strictEqual(users.length, firstNames.length);
						},
					);

					{
						await testContext.test(
							"select",
							async () => {
								const users = await userRepository.getAll();
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
								const users = await userRepository.getAllNotDeletedWithRole();
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
								const users = await userRepository.model.queryBuilder()
									.select(["id"])
									.where({ params: {} })
									.execute<{ id: string; }>();

								{
									await userRepository.getActualByParams({
										first_name: { $ilike: "Max" },
										ids: { $in: users.map((e) => e.id) },
									});
								}

								{
									await userRepository.getActualByParams({
										first_name: { $ilike: "Max" },
										ids: { $nin: users.map((e) => e.id) },
									});
								}
							},
						);
					}

					{
						await testContext.test(
							"User.getList",
							async () => {
								const users = await userRepository.getList({
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
								const [list, count] = await userRepository.getListAndCount({
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
								const users = await userRepository.getAllWithTitleUser();

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
								const users = await userRepository.getAllWithTitleUserWithPagination();

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
								const stat = await userRepository.getCountByUserRolesTitle();

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
								const stat = await userRepository.getCountByUserRolesTitleWithCountGte5();

								assert.strictEqual(stat.length, 1);

								const firstEl = stat.at(0);

								assert.strictEqual(firstEl?.title, "user");
								assert.strictEqual(firstEl?.users_count, "5");
							},
						);
					}
					await userRepository.deleteAll();
				}
			},
		);

		await testContext.test(
			"Helpers.migrationsDown",
			async () => { await Helpers.migrationsDown(creds, TEST_NAME); },
		);

		await repositoryManager.shutdown();

		await testContext.test(
			"Helpers.connectionShutdown",
			async () => { await Helpers.connectionShutdown(); },
		);
	});
};
