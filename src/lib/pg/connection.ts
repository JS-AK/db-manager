import pg from "pg";

import { PG } from "../..";

const pools = new Map<string, pg.Pool>();

export const getStandartPool = (config: PG.ModelTypes.TDBCreds, poolName = "00") => {
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

export const getTransactionPool = (config: PG.ModelTypes.TDBCreds, poolName = "00") => {
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
