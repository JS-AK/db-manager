import mysql from "mysql2/promise";

import { MYSQL } from "../../index.js";

const pools = new Map<string, mysql.Pool>();

export const createConnection = async (config: mysql.ConnectionOptions): Promise<mysql.Connection> => {
	return mysql.createConnection(config);
};
export const getStandardPool = (config: MYSQL.ModelTypes.TDBCreds, poolName = "00"): mysql.Pool => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "st" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = mysql.createPool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

export const getTransactionPool = (config: MYSQL.ModelTypes.TDBCreds, poolName = "00"): mysql.Pool => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "tr" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = mysql.createPool(config);

		pools.set(credsString, pool);

		return pool;
	}
};

export const removeStandardPool = async (config: MYSQL.ModelTypes.TDBCreds, poolName = "00"): Promise<void> => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "st" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const pool = pools.get(credsString);

	if (pool) {
		pools.delete(credsString);

		await pool.end();
	}
};

export const removeTransactionPool = async (config: MYSQL.ModelTypes.TDBCreds, poolName = "00"): Promise<void> => {
	const { database, host, password, port, user } = config;
	const poolNameResult = "tr" + poolName;
	const credsString = `${poolNameResult}#${user}:${password}@${host}:${port}/${database}`;

	const pool = pools.get(credsString);

	if (pool) {
		pools.delete(credsString);

		await pool.end();
	}
};
