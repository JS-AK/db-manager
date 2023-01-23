import mysql from "mysql2";

const pools = new Map();

export const getStandartPool = (creds: mysql.ConnectionOptions) => {
	if (pools.has(creds)) {
		return pools.get(creds);
	} else {
		const pool = mysql.createPool(creds);

		pools.set(creds, pool);

		return pool;
	}
};
