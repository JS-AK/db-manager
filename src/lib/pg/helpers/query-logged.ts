import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";

async function queryLogged<T extends pg.QueryResultRow>(
	this: {
		client: pg.Pool | pg.PoolClient;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values: unknown[],
) {
	const start = performance.now();

	try {
		const data = await this.client.query<T>(query, values);
		const execTime = Math.round(performance.now() - start);

		this.logger.info(`Query executed successfully in ${execTime} ms. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);

		return data;
	} catch (error) {
		const execTime = Math.round(performance.now() - start);

		this.logger.error(`Query failed in ${execTime} ms. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);

		throw error;
	}
}

export function setLoggerAndExecutor(
	pool: pg.Pool | pg.PoolClient,
	options?: {
		isLoggerEnabled?: true;
		logger?: SharedTypes.TLogger;
	},
) {
	const { isLoggerEnabled, logger } = options || {};

	if (isLoggerEnabled) {
		// eslint-disable-next-line no-console
		const resultLogger = logger || { error: console.error, info: console.log };

		return {
			executeSql: async <T extends pg.QueryResultRow>(sql: {
				query: string;
				values: unknown[];
			}) => (await (queryLogged<T>).bind({ client: pool, logger: resultLogger })(sql.query, sql.values)),
			isLoggerEnabled,
			logger: resultLogger,
		};
	} else {
		return {
			executeSql: async <T extends pg.QueryResultRow>(sql: {
				query: string;
				values: unknown[];
			}) => (await pool.query<T>(sql.query, sql.values)),
			isLoggerEnabled,
		};
	}
}
