import path, { basename, dirname } from "node:path";

import { MYSQL } from "./index.js";

export const connectionShutdown = async () => {
	await MYSQL.connection.shutdown();
};

export const getParentDirectoryName = (filename: string): string => {
	return basename(dirname(filename));
};

export const migrationsDown = async (
	creds: MYSQL.ModelTypes.TDBCreds,
	TEST_NAME: string,
) => {
	const pool = MYSQL.BaseModel.getStandardPool({ ...creds, multipleStatements: true }, "migrations");

	await MYSQL.MigrationSystem.Down.start(pool, {
		logger: false,
		migrationsTableName: "migration_control",
		pathToSQL: path.resolve(process.cwd(), "src", "test", "MYSQL", TEST_NAME, "migrations", "sql"),
	});

	await MYSQL.BaseModel.removeStandardPool(creds, "migrations");
};

export const migrationsUp = async (
	creds: MYSQL.ModelTypes.TDBCreds,
	TEST_NAME: string,
) => {
	const pool = MYSQL.BaseModel.getStandardPool({ ...creds, multipleStatements: true }, "migrations");

	await MYSQL.MigrationSystem.Down.start(pool, {
		logger: false,
		migrationsTableName: "migration_control",
		pathToSQL: path.resolve(process.cwd(), "src", "test", "MYSQL", TEST_NAME, "migrations", "sql"),
	});

	await MYSQL.MigrationSystem.Up.start(pool, {
		logger: false,
		migrationsTableName: "migration_control",
		pathToSQL: path.resolve(process.cwd(), "src", "test", "MYSQL", TEST_NAME, "migrations", "sql"),
	});

	await MYSQL.BaseModel.removeStandardPool(creds, "migrations");
};
