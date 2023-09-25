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
			"CRUD",
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
								const userRole = await UserRole.getGuaranteedOneByParams({
									params: { title: "admin" },
									selected: ["id"],
								});

								const userInitial = await User.getGuaranteedOneByParams({
									params: { id_user_role: userRole.id },
									selected: ["first_name", "id"],
								});

								const res = await User.updateOneByPk(userInitial.id, {
									last_name: "Brown",
								});

								assert.equal(res?.id, userInitial.id);
								assert.equal(res?.first_name, userInitial.first_name);
								assert.equal(res?.last_name, "Brown");

								const userUpdated = await User.getGuaranteedOneByParams({
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
