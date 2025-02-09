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
 * @param [poolName="shared"] - The name suffix for the pool, default is "shared".
 *
 * @returns The retrieved or newly created standard connection pool.
 */
export const getStandardPool = (
	config: PG.ModelTypes.TDBCreds,
	poolName = "shared",
): pg.Pool => {
	const poolNameResult = "st-" + poolName;

	return getPool(config, poolNameResult);
};

/**
 * Retrieves or creates a transaction-specific connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="shared"] - The name suffix for the pool, default is "shared".
 *
 * @returns The retrieved or newly created transaction connection pool.
 */
export const getTransactionPool = (
	config: PG.ModelTypes.TDBCreds,
	poolName: string = "shared",
): pg.Pool => {
	const poolNameResult = "tr-" + poolName;

	return getPool(config, poolNameResult);
};

/**
 * Removes and closes a standard connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="shared"] - The name suffix for the pool, default is "shared".
 *
 * @returns A promise that resolves when the pool is closed.
 */
export const removeStandardPool = async (
	config: PG.ModelTypes.TDBCreds,
	poolName: string = "shared",
): Promise<void> => {
	const poolNameResult = "st-" + poolName;

	return removePool(config, poolNameResult);
};

/**
 * Removes and closes a transaction-specific connection pool.
 *
 * @param config - The database credentials configuration object.
 * @param [poolName="shared"] - The name suffix for the pool, default is "shared".
 *
 * @returns A promise that resolves when the pool is closed.
 */
export const removeTransactionPool = async (
	config: PG.ModelTypes.TDBCreds,
	poolName: string = "shared",
): Promise<void> => {
	const poolNameResult = "tr-" + poolName;

	return removePool(config, poolNameResult);
};

/**
 * Gracefully shuts down all active connection pools.
 *
 * @param options - The options object.
 * @param options.poolName - The pool name to match.
 *
 * @returns A promise that resolves when all pools are closed.
 */
export const shutdown = async (options?: { poolName?: string; }): Promise<void> => {
	const poolShutdowns: Promise<void>[] = [];
	const poolNames: string[] = [];

	const poolName = options?.poolName;

	if (poolName) {
		for (const [credsString, pool] of pools) {
			if (
				credsString !== `st-${poolName}`
				&& credsString !== `tr-${poolName}`
			) {
				continue;
			}

			poolShutdowns.push(pool.end());
			poolNames.push(credsString);
		}
	} else {
		for (const [credsString, pool] of pools) {
			poolShutdowns.push(pool.end());
			poolNames.push(credsString);
		}
	}

	if (poolShutdowns.length === 0) {
		return;
	}

	for (const poolName of poolNames) {
		pools.delete(poolName);
	}

	await Promise.all(poolShutdowns);
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
	config: PG.ModelTypes.TDBCreds,
	poolName: string,
): pg.Pool => {
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
		const pool = new pg.Pool(config);

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
	config: PG.ModelTypes.TDBCreds,
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
