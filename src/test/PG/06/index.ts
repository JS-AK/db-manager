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

		const adminRepository = repositoryManager.repository.admin;
		const testUserRepository = repositoryManager.repository.testUser;
		const userRepository = repositoryManager.repository.user;

		await testContext.test(
			"Helpers.migrationsUp",
			async () => { await Helpers.migrationsUp(creds, TEST_NAME); },
		);

		await testContext.test(
			"Query builder operations",
			async (testContext) => {
				await testContext.test(
					"1. select",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.select(["1=1"]);

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 1=1 FROM users;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"2. select",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.select(["1=1"])
							.select(["2=2"]);

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 2=2 FROM users;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"1. select & from",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.select(["1=1"])
							.from("users AS u");

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 1=1 FROM users AS u;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"2. select & from",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.from("users")
							.select(["1=1"]);

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 1=1 FROM users;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"3. select & from",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.from("users")
							.select(["1=1"])
							.select(["2=2"]);

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 2=2 FROM users;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"4. select & from",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.select(["1=1"])
							.select(["2=2"])
							.from("users");

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 2=2 FROM users;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"5. select & from",
					async () => {
						const qb = adminRepository.model.queryBuilder()
							.from("users")
							.select(["1=1"])
							.select(["2=2"])
							.from("admins");

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 2=2 FROM admins;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"6. select & from",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.select(["1=1"])
							.from("(SELECT SUM(id) AS a, SUM(id) AS b FROM users) u");

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 1=1 FROM (SELECT SUM(id) AS a, SUM(id) AS b FROM users) u;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await testContext.test(
					"7. select & from",
					async () => {
						const qb = userRepository.model.queryBuilder()
							.select(["1=1"])
							.from(userRepository.model.queryBuilder()
								.select(["2=2"])
								.from("users")
								.toSubquery("u"),
							);

						const result = qb.compareQuery();

						assert.strictEqual(result.query, "SELECT 1=1 FROM (SELECT 2=2 FROM users) AS u;");
						assert.strictEqual(result.values.length, 0);

						await qb.execute();
					},
				);

				await userRepository.deleteAll();
			},
		);

		await testContext.test(
			"Composite pk",
			async (testContext) => {
				const user = await testUserRepository.createOne({ first_name: "test" });

				await testContext.test(
					"testUser.getOneByPk",
					async () => {
						const { one: result } = await testUserRepository.getOneByPk([user.id, user.id_sec]);

						if (!result) throw new Error("result is empty");

						assert.strictEqual(result.first_name, "test");
					},
				);

				await testContext.test(
					"testUserRepository.getOneByPk",
					async () => {
						const result = await testUserRepository.updateOneByPk([user.id, user.id_sec], { last_name: "test" });

						if (!result) throw new Error("result is empty");

						assert.strictEqual(result.first_name, "test");
						assert.strictEqual(result.last_name, "test");
					},
				);

				await testContext.test(
					"testUserRepository.getCountByPks",
					async () => {
						const result = await testUserRepository.getCountByPks([[user.id, user.id_sec]]);

						assert.strictEqual(result, 1);
					},
				);

				await testContext.test(
					"testUserRepository.getCountByPksAndParams",
					async () => {
						const result = await testUserRepository.getCountByPksAndParams([[user.id, user.id_sec]], {
							params: { created_at: { $gte: new Date("1970") } },
						});

						assert.strictEqual(result, 1);
					},
				);

				await testContext.test(
					"testUserRepository.getCountByPksAndParams",
					async () => {
						const result = await testUserRepository.getCountByPksAndParams([[user.id, user.id_sec]], {
							params: {},
						});

						assert.strictEqual(result, 1);
					},
				);

				await testContext.test(
					"testUserRepository.deleteOneByPk",
					async () => {
						const result = await testUserRepository.deleteOneByPk([user.id, user.id_sec]);

						if (!result) throw new Error("result is empty");

						assert.strictEqual(result[0], user.id);
						assert.strictEqual(result[1], user.id_sec);
					},
				);
			},
		);

		await repositoryManager.shutdown();

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
