import path, { basename, dirname } from "node:path";

import { PG } from "./index.js";

export const connectionShutdown = async () => {
	await PG.connection.shutdown();
};

export const getParentDirectoryName = (filename: string): string => {
	return basename(dirname(filename));
};

export const migrationsDown = async (
	creds: PG.ModelTypes.TDBCreds,
	TEST_NAME: string,
) => {
	const pool = PG.BaseModel.getStandardPool(creds, "migrations");

	await PG.MigrationSystem.Down.start(pool, {
		logger: false,
		migrationsTableName: "migration_control",
		pathToSQL: path.resolve(process.cwd(), "src", "test", "PG", TEST_NAME, "migrations", "sql"),
	});

	await PG.BaseModel.removeStandardPool(creds, "migrations");
};

export const migrationsUp = async (
	creds: PG.ModelTypes.TDBCreds,
	TEST_NAME: string,
) => {
	const pool = PG.BaseModel.getStandardPool(creds, "migrations");

	await PG.MigrationSystem.Down.start(pool, {
		logger: false,
		migrationsTableName: "migration_control",
		pathToSQL: path.resolve(process.cwd(), "src", "test", "PG", TEST_NAME, "migrations", "sql"),
	});

	await PG.MigrationSystem.Up.start(pool, {
		logger: false,
		migrationsTableName: "migration_control",
		pathToSQL: path.resolve(process.cwd(), "src", "test", "PG", TEST_NAME, "migrations", "sql"),
	});

	await PG.BaseModel.removeStandardPool(creds, "migrations");
};
