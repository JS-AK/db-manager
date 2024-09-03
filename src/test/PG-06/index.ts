import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as Admin from "./admin/index.js";
import * as User from "./user/index.js";
import * as UserTest from "./user-test/index.js";

export const start = async (creds: PG.ModelTypes.TDBCreds) => {
	const admin = Admin.domain(creds);
	const user = User.domain(creds);
	const userTest = UserTest.domain(creds);

	return test("PG-06", async (testContext) => {
		await testContext.test(
			"create tables",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${admin.tableName} CASCADE;

					CREATE TABLE ${admin.tableName}(
					    id                              BIGSERIAL PRIMARY KEY,

					    first_name                      TEXT,
					    last_name                       TEXT,

					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE
					);
				`);
				await pool.query(`
					DROP TABLE IF EXISTS ${user.tableName} CASCADE;

					CREATE TABLE ${user.tableName}(
					    id                              BIGSERIAL PRIMARY KEY,

					    first_name                      TEXT,
					    last_name                       TEXT,

					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE
					);
				`);
				await pool.query(`
					DROP TABLE IF EXISTS ${userTest.tableName} CASCADE;

					CREATE TABLE ${userTest.tableName}(
					    id                              UUID DEFAULT gen_random_uuid(),
					    id_sec                          UUID DEFAULT gen_random_uuid(),

					    first_name                      TEXT,
					    last_name                       TEXT,

					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE,

					    CONSTRAINT pk_id_id_sec PRIMARY KEY (id, id_sec)
					);
				`);
			},
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

						assert.equal(result.query, "SELECT 1=1 FROM users;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 2=2 FROM users;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 1=1 FROM users AS u;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 1=1 FROM users;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 2=2 FROM users;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 2=2 FROM users;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 2=2 FROM admins;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 1=1 FROM (SELECT SUM(id) AS a, SUM(id) AS b FROM users) u;");
						assert.equal(result.values.length, 0);

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

						assert.equal(result.query, "SELECT 1=1 FROM (SELECT 2=2 FROM users) AS u;");
						assert.equal(result.values.length, 0);

						await qb.execute();
					},
				);

				await user.deleteAll();
			},
		);

		await testContext.test(
			"Composite pk",
			async (testContext) => {
				const user = await userTest.createOne({ first_name: "test" });

				await testContext.test(
					"userTest.getOneByPk",
					async () => {
						const { one: result } = await userTest.getOneByPk([user.id, user.id_sec]);

						if (!result) throw new Error("result is empty");

						assert.equal(result.first_name, "test");
					},
				);

				await testContext.test(
					"userTest.getOneByPk",
					async () => {
						const result = await userTest.updateOneByPk([user.id, user.id_sec], { last_name: "test" });

						if (!result) throw new Error("result is empty");

						assert.equal(result.first_name, "test");
						assert.equal(result.last_name, "test");
					},
				);

				await testContext.test(
					"userTest.getCountByPks",
					async () => {
						const result = await userTest.getCountByPks([[user.id, user.id_sec]]);

						assert.equal(result, 1);
					},
				);

				await testContext.test(
					"userTest.getCountByPksAndParams",
					async () => {
						const result = await userTest.getCountByPksAndParams([[user.id, user.id_sec]], {
							params: { created_at: { $gte: new Date("1970") } },
						});

						assert.equal(result, 1);
					},
				);

				await testContext.test(
					"userTest.getCountByPksAndParams",
					async () => {
						const result = await userTest.getCountByPksAndParams([[user.id, user.id_sec]], {
							params: {},
						});

						assert.equal(result, 1);
					},
				);

				await testContext.test(
					"userTest.deleteOneByPk",
					async () => {
						const result = await userTest.deleteOneByPk([user.id, user.id_sec]);

						if (!result) throw new Error("result is empty");

						assert.equal(result[0], user.id);
						assert.equal(result[1], user.id_sec);
					},
				);
			},
		);

		await testContext.test(
			"dropTable",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${admin.tableName};`);
				await pool.query(`DROP TABLE IF EXISTS ${user.tableName};`);
				await pool.query(`DROP TABLE IF EXISTS ${userTest.tableName};`);
			},
		);

		await testContext.test("PG.connection shutdown", async () => await PG.connection.shutdown());
	});
};
