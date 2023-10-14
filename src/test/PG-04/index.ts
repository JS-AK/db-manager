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

	return test("PG-04", async (testContext) => {
		await testContext.test(
			"create table",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					DROP TABLE IF EXISTS ${UserRole.tableName};
					CREATE TABLE ${UserRole.tableName}(
					    id                              BIGSERIAL PRIMARY KEY,
					    title                           TEXT UNIQUE,
					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE
					);
					INSERT INTO ${UserRole.tableName} (title) VALUES ('admin'), ('head'), ('user');
				`);
				await pool.query(`
					DROP TABLE IF EXISTS ${User.tableName};

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
			"queryBuilder",
			async (testContext) => {
				{
					await testContext.test(
						"create admin",
						async () => {
							const userRole = await UserRole.getGuaranteedOneByParams({
								params: { title: "admin" },
								selected: ["id"],
							});

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
							const userRole = await UserRole.getGuaranteedOneByParams({
								params: { title: "head" },
								selected: ["id"],
							});

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
							const userRole = await UserRole.getGuaranteedOneByParams({
								params: { title: "user" },
								selected: ["id"],
							});

							await Promise.all(
								["John", "Mary", "Peter", "Max", "Ann"].map((e) =>
									User.createOne({ first_name: e, id_user_role: userRole.id }),
								),
							);
						},
					);

					{
						await testContext.test(
							"select",
							async () => {
								const users = await User
									.queryBuilder()
									.select(["*"])
									.execute<UserTable.Types.TableFields>();
								const firstUser = users.at(0);

								assert.equal(users.length, 7);
								assert.equal(typeof firstUser?.id, "string");
								assert.equal(typeof firstUser?.id_user_role, "string");
								assert.equal(typeof firstUser?.is_deleted, "boolean");
								assert.equal(typeof firstUser?.first_name, "string");
								assert.equal(firstUser?.last_name, null);
								assert.equal(typeof firstUser?.created_at, "string");
								assert.equal(firstUser?.updated_at, null);
							},
						);
					}

					{
						await testContext.test(
							"select + where",
							async () => {
								const users = await User
									.queryBuilder()
									.select(["*"])
									.where({
										params: {
											id_user_role: { $ne: null },
											is_deleted: false,
										},
									})
									.execute<UserTable.Types.TableFields>();
								const firstUser = users.at(0);

								assert.equal(users.length, 7);
								assert.equal(typeof firstUser?.id, "string");
								assert.equal(typeof firstUser?.id_user_role, "string");
								assert.equal(typeof firstUser?.is_deleted, "boolean");
								assert.equal(typeof firstUser?.first_name, "string");
								assert.equal(firstUser?.last_name, null);
								assert.equal(typeof firstUser?.created_at, "string");
								assert.equal(firstUser?.updated_at, null);
							},
						);
					}

					{
						await testContext.test(
							"select + rightJoin + where + orderBy",
							async () => {
								const users = await User
									.queryBuilder()
									.select([
										"users.first_name AS first_name",
										"users.id AS id",
										"users.last_name AS last_name",
										"user_roles.id AS ur_id",
										"user_roles.title AS ur_title",
									])
									.rightJoin({
										initialField: "id_user_role",
										targetField: "id",
										targetTableName: "user_roles",
									})
									.where({ params: { "user_roles.title": "user" } })
									.orderBy([{ column: "users.first_name", sorting: "ASC" }])
									.execute<UserTable.Types.ListedEntity>();

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
								const users = await User
									.queryBuilder()
									.select([
										"users.first_name AS first_name",
										"users.id AS id",
										"users.last_name AS last_name",
										"user_roles.id AS ur_id",
										"user_roles.title AS ur_title",
									])
									.rightJoin({
										initialField: "id_user_role",
										targetField: "id",
										targetTableName: "user_roles",
									})
									.where({ params: { "user_roles.title": "user" } })
									.orderBy([{ column: "users.first_name", sorting: "ASC" }])
									.pagination({ limit: 3, offset: 1 })
									.execute<UserTable.Types.ListedEntity>();

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
								const stat = await User
									.queryBuilder()
									.select([
										"COUNT(users.id) AS users_count",
										"user_roles.title AS title",
									])
									.rightJoin({
										initialField: "id_user_role",
										targetField: "id",
										targetTableName: "user_roles",
									})
									.where({ params: { "users.is_deleted": false } })
									.orderBy([{ column: "user_roles.title", sorting: "ASC" }])
									.groupBy(["user_roles.title"])
									.execute<UserTable.Types.UsersByUserRoleTitle>();

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
								const stat = await User
									.queryBuilder()
									.select([
										"COUNT(users.id) AS users_count",
										"user_roles.title AS title",
									])
									.rightJoin({
										initialField: "id_user_role",
										targetField: "id",
										targetTableName: "user_roles",
									})
									.where({ params: { "users.is_deleted": false } })
									.orderBy([{ column: "user_roles.title", sorting: "ASC" }])
									.groupBy(["user_roles.title"])
									.having({ params: { "COUNT(users.id)": { $gte: 5 } } })
									.execute();

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
