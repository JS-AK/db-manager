import pg from "pg";

import { PG } from "../../index.js";

const pools = new Map<string, pg.Pool>();

export const createClient = (config: string | pg.ClientConfig): pg.Client => {
	return new pg.Client(config);
};

export const getStandardPool = (config: PG.ModelTypes.TDBCreds, poolName = "00"): pg.Pool => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "st" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = new pg.Pool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

export const getTransactionPool = (config: PG.ModelTypes.TDBCreds, poolName = "00"): pg.Pool => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "tr" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = new pg.Pool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

export const removeStandardPool = async (config: PG.ModelTypes.TDBCreds, poolName = "00"): Promise<void> => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "st" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const pool = pools.get(credsString);

	if (pool) {
		pools.delete(credsString);

		await pool.end();
	}
};

export const removeTransactionPool = async (config: PG.ModelTypes.TDBCreds, poolName = "00"): Promise<void> => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "tr" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const pool = pools.get(credsString);

	if (pool) {
		pools.delete(credsString);

		await pool.end();
	}
};
