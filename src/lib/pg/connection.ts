import pg from "pg";

import { PG } from "../../index.js";

const pools = new Map<string, pg.Pool>();

/**
 * Creates a new PostgreSQL client instance.
 *
 * @param config - The connection configuration as a connection string or a client configuration object.
 *
 * @returns The PostgreSQL client instance.
 */
export const createClient = (config: string | pg.ClientConfig): pg.Client => {
	return new pg.Client(config);
};

/**
 * Retrieves or creates a standard connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns The retrieved or newly created standard connection pool.
 */
export const getStandardPool = (config: PG.ModelTypes.TDBCreds, poolName = "00"): pg.Pool => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "st" + poolName;
	const credsString = _createCredsString(poolNameResult, {
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
		const pool = new pg.Pool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

/**
 * Retrieves or creates a transaction-specific connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns The retrieved or newly created transaction connection pool.
 */
export const getTransactionPool = (config: PG.ModelTypes.TDBCreds, poolName: string = "00"): pg.Pool => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "tr" + poolName;
	const credsString = _createCredsString(poolNameResult, {
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
		const pool = new pg.Pool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

/**
 * Removes and closes a standard connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns A promise that resolves when the pool is closed.
 */
export const removeStandardPool = async (config: PG.ModelTypes.TDBCreds, poolName: string = "00"): Promise<void> => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "st" + poolName;
	const credsString = _createCredsString(poolNameResult, {
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

/**
 * Removes and closes a transaction-specific connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="00"] - The name suffix for the pool, default is "00".
 *
 * @returns A promise that resolves when the pool is closed.
 */
export const removeTransactionPool = async (config: PG.ModelTypes.TDBCreds, poolName: string = "00"): Promise<void> => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "tr" + poolName;
	const credsString = _createCredsString(poolNameResult, {
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
const _createCredsString = (poolName: string, creds: { user: string; password: string; host: string; port: number; database: string; }): string => {
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
