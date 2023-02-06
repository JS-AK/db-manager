import mysql from "mysql2";

import { MYSQL } from "../..";

const pools = new Map<string, mysql.Pool>();

export const getStandartPool = (creds: MYSQL.ModelTypes.TDBCreds) => {
	const { database, host, password, port, user } = creds;
	const poolName = "st" + creds.poolName || "00";
	const credsString = `${poolName}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = mysql.createPool({
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

export const getTransactionPool = (creds: MYSQL.ModelTypes.TDBCreds) => {
	const { database, host, password, port, user } = creds;
	const poolName = "tr" + creds.poolName || "00";
	const credsString = `${poolName}#${user}:${password}@${host}:${port}/${database}`;

	const poolCandidate = pools.get(credsString);

	if (poolCandidate) {
		return poolCandidate;
	} else {
		const pool = mysql.createPool({
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
