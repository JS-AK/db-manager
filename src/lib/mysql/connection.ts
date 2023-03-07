import mysql from "mysql2";

import { MYSQL } from "../..";

const pools = new Map<string, mysql.Pool>();

export const createConnection = (config: MYSQL.ModelTypes.TDBCreds) => {
	return mysql.createConnection(config);
};

export const getStandartPool = (config: MYSQL.ModelTypes.TDBCreds, poolName = "00") => {
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

export const getTransactionPool = (config: MYSQL.ModelTypes.TDBCreds, poolName = "00") => {
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
