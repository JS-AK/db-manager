import assert from "node:assert";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { PG } from "../index.js";

import * as Helpers from "../helpers.js";

import * as TestUser from "./test-user/index.js";
import * as User from "./user/index.js";

const TEST_NAME = Helpers.getParentDirectoryName(fileURLToPath(import.meta.url));

export const start = async (creds: PG.ModelTypes.TDBCreds) => {
	const testUser = TestUser.domain(creds);
	const user = User.domain(creds);

	return test("PG-" + TEST_NAME, async (testContext) => {
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
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
						const qb = user.model.queryBuilder()
							.select(["1=1"])
							.from(user.model.queryBuilder()
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

				await user.deleteAll();
			},
		);

		await testContext.test(
			"Composite pk",
			async (testContext) => {
				const user = await testUser.createOne({ first_name: "test" });

				await testContext.test(
					"testUser.getOneByPk",
					async () => {
						const { one: result } = await testUser.getOneByPk([user.id, user.id_sec]);

						if (!result) throw new Error("result is empty");

						assert.strictEqual(result.first_name, "test");
					},
				);

				await testContext.test(
					"testUser.getOneByPk",
					async () => {
						const result = await testUser.updateOneByPk([user.id, user.id_sec], { last_name: "test" });

						if (!result) throw new Error("result is empty");

						assert.strictEqual(result.first_name, "test");
						assert.strictEqual(result.last_name, "test");
					},
				);

				await testContext.test(
					"testUser.getCountByPks",
					async () => {
						const result = await testUser.getCountByPks([[user.id, user.id_sec]]);

						assert.strictEqual(result, 1);
					},
				);

				await testContext.test(
					"testUser.getCountByPksAndParams",
					async () => {
						const result = await testUser.getCountByPksAndParams([[user.id, user.id_sec]], {
							params: { created_at: { $gte: new Date("1970") } },
						});

						assert.strictEqual(result, 1);
					},
				);

				await testContext.test(
					"testUser.getCountByPksAndParams",
					async () => {
						const result = await testUser.getCountByPksAndParams([[user.id, user.id_sec]], {
							params: {},
						});

						assert.strictEqual(result, 1);
					},
				);

				await testContext.test(
					"testUser.deleteOneByPk",
					async () => {
						const result = await testUser.deleteOneByPk([user.id, user.id_sec]);

						if (!result) throw new Error("result is empty");

						assert.strictEqual(result[0], user.id);
						assert.strictEqual(result[1], user.id_sec);
					},
				);
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
