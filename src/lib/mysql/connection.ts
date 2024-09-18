import mysql from "mysql2/promise";

import { MYSQL } from "../../index.js";

const pools = new Map<string, mysql.Pool>();

/**
 * Creates a MySQL connection with the given configuration.
 *
 * @param config - The configuration options for the MySQL connection.
 *
 * @returns The MySQL connection.
 */
export const createConnection = async (config: mysql.ConnectionOptions): Promise<mysql.Connection> => {
	return mysql.createConnection(config);
};

/**
 * Retrieves or creates a standard connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns The retrieved or newly created standard connection pool.
 */
export const getStandardPool = (
	config: MYSQL.ModelTypes.TDBCreds,
	poolName: string = "00",
): mysql.Pool => {
	const poolNameResult = "st" + poolName;

	return getPool(config, poolNameResult);
};

/**
 * Retrieves or creates a transaction-specific connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns The retrieved or newly created transaction connection pool.
 */
export const getTransactionPool = (
	config: MYSQL.ModelTypes.TDBCreds,
	poolName: string = "00",
): mysql.Pool => {
	const poolNameResult = "tr" + poolName;

	return getPool(config, poolNameResult);
};

/**
 * Removes and closes a standard connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns A promise that resolves when the pool is closed.
 */
export const removeStandardPool = async (
	config: MYSQL.ModelTypes.TDBCreds,
	poolName: string = "00",
): Promise<void> => {
	const poolNameResult = "st" + poolName;

	return removePool(config, poolNameResult);
};

/**
 * Removes and closes a transaction-specific connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns A promise that resolves when the pool is closed.
 */
export const removeTransactionPool = async (
	config: MYSQL.ModelTypes.TDBCreds,
	poolName: string = "00",
): Promise<void> => {
	const poolNameResult = "tr" + poolName;

	return removePool(config, poolNameResult);
};

/**
 * Gracefully shuts down all active connection pools.
 *
 * @returns A promise that resolves when all pools are closed.
 */
export const shutdown = async (): Promise<void> => {
	const poolShutdowns: Promise<void>[] = [];

	for (const [_credsString, pool] of pools) {
		poolShutdowns.push(pool.end());
	}

	try {
		await Promise.all(poolShutdowns);
	} finally {
		pools.clear();
	}
};

/**
 * Creates a connection credentials string.
 * This string is used as a key in the pools map to identify different pools.
 *
 * @param poolName - The name prefix for the pool.
 * @param creds - The credentials object.
 * @param creds.user - The database user.
 * @param creds.password - The database password.
 * @param creds.host - The database host.
 * @param creds.port - The database port.
 * @param creds.database - The database name.
 *
 * @returns The constructed credentials string.
 */
const createCredsString = (
	poolName: string,
	creds: { user: string; password: string; host: string; port: number; database: string; },
): string => {
	return `${poolName}#${creds.user}:${creds.password}@${creds.host}:${creds.port}/${creds.database}`;
};

/**
 * Masks sensitive information in a connection string.
 *
 * @param credsString - The connection credentials string.
 *
 * @returns The credentials string with sensitive information masked.
 */
const _maskSensitiveInfo = (credsString: string): string => {
	return credsString.replace(/:.+@/, ":<hidden>@");
};

/**
 * Retrieves or creates a named connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param poolName - The name suffix for the pool.
 *
 * @returns The retrieved or newly created standard connection pool.
 */
const getPool = (
	config: MYSQL.ModelTypes.TDBCreds,
	poolName: string,
): mysql.Pool => {
	const { database, host, password, port, user } = config;
	const credsString = createCredsString(poolName, {
		database,
		host,
		password,
		port,
		user,
	});

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = mysql.createPool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

/**
 * Removes and closes a named connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param poolName - The name suffix for the pool.
 *
 * @returns A promise that resolves when the pool is closed.
 */
const removePool = async (
	config: MYSQL.ModelTypes.TDBCreds,
	poolName: string,
): Promise<void> => {
	const { database, host, password, port, user } = config;
	const credsString = createCredsString(poolName, {
		database,
		host,
		password,
		port,
		user,
	});

	const pool = pools.get(credsString);

	if (pool) {
		pools.delete(credsString);

		await pool.end();
	}
};
