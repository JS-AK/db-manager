import pg from "pg";

import { PG } from "../..";

const pools = new Map<string, pg.Pool>();

export const getStandartPool = (creds: PG.ModelTypes.TDBCreds) => {
	const { database, host, password, port, user } = creds;
	const poolName = "st" + creds.poolName || "00";
	const credsString = `${poolName}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = new pg.Pool({
			database,
			host,
			password,
			port,
			user,
		});

		pools.set(credsString, pool);

		return pool;
	}
};

export const getTransactionPool = (creds: PG.ModelTypes.TDBCreds) => {
	const { database, host, password, port, user } = creds;
	const poolName = "tr" + creds.poolName || "00";
	const credsString = `${poolName}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = new pg.Pool({
			database,
			host,
			password,
			port,
			user,
		});

		pools.set(credsString, pool);

		return pool;
	}
};
