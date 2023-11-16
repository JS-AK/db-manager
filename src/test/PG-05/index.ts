import assert from "node:assert";
import test from "node:test";

import { PG } from "../../index.js";

import * as FileSystemTable from "./file-system/index.js";

const creds = {
	database: "postgres",
	host: process.env.POSTGRES_HOST || "localhost",
	password: "admin",
	port: parseInt(process.env.POSTGRES_PORT || "", 10) || 5432,
	user: "postgres",
};

export default async () => {
	const FileSystem = new FileSystemTable.Domain(creds);

	return test("PG-05", async (testContext) => {
		await testContext.test(
			"create table",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`
					CREATE EXTENSION IF NOT EXISTS LTREE;
					DROP TABLE IF EXISTS ${FileSystem.tableName};
					CREATE TABLE ${FileSystem.tableName}(
					    id                              BIGSERIAL PRIMARY KEY,

					    name                            TEXT NOT NULL,
					    is_folder                       BOOLEAN NOT NULL,
					    path                            LTREE NOT NULL,

					    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					    updated_at                      TIMESTAMP WITH TIME ZONE
					);
					CREATE INDEX ${FileSystem.tableName}_path_gist ON ${FileSystem.tableName} USING gist(path);
				`);
			},
		);

		await testContext.test(
			"queryBuilder",
			async (testContext) => {
				{
					await testContext.test(
						"create data",
						async () => {
							await FileSystem.createOne({ is_folder: true, name: "root", path: "root" });
							await FileSystem.createOne({ is_folder: true, name: "etc", path: "root.etc" });
							await FileSystem.createOne({ is_folder: true, name: "passwd", path: "root.etc.passwd" });
							await FileSystem.createOne({ is_folder: true, name: "home", path: "root.home" });
							await FileSystem.createOne({ is_folder: true, name: "user", path: "root.home.user" });
							await FileSystem.createOne({ is_folder: true, name: "documents", path: "root.home.user.documents" });
						},
					);

					{
						await testContext.test(
							"getAll",
							async () => {
								const fileSystem = await FileSystem.getAll();

								assert.equal(fileSystem.length, 6);
							},
						);
					}

					{
						await testContext.test(
							"getAllWithLevel",
							async () => {
								const fileSystem = await FileSystem.getAllWithLevel();

								assert.equal(fileSystem.length, 6);
							},
						);
					}

					{
						await testContext.test(
							"getAllInsideHomePath",
							async () => {
								const fileSystem = await FileSystem.getAllInsideHomePath();

								assert.equal(fileSystem.length, 3);
							},
						);
					}

					{
						await testContext.test(
							"getAllOutsideHomePath",
							async () => {
								const fileSystem = await FileSystem.getAllOutsideHomePath();

								assert.equal(fileSystem.length, 2);
							},
						);
					}

					await FileSystem.deleteAll();
				}
			},
		);

		await testContext.test(
			"dropTable",
			async () => {
				const pool = PG.BaseModel.getStandardPool(creds);

				await pool.query(`DROP TABLE IF EXISTS ${FileSystem.tableName};`);
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
