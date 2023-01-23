import pg from "pg";

const pools = new Map();

export const getStandartPool = (creds: pg.ClientConfig) => {
	if (pools.has(creds)) {
		return pools.get(creds);
	} else {
		const pool = new pg.Pool(creds);

		pools.set(creds, pool);

		return pool;
	}
};

export const getTransactionPool = (creds: pg.ClientConfig) => {
	return new pg.Pool(creds);
};
