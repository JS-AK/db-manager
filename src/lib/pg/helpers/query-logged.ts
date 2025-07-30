import { randomUUID } from "node:crypto";

import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import { TExecutor } from "../model/types.js";

async function queryLogged<T extends pg.QueryResultRow>(
	this: {
		client: TExecutor;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values?: unknown[],
): Promise<pg.QueryResult<T>> {
	const queryId = randomUUID();
	const start = performance.now();

	this.logger.info(`[${queryId}] Query started. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);

	try {
		const data = await this.client.query<T>(query, values);
		const execTime = Math.round(performance.now() - start);

		this.logger.info(`[${queryId}] Query executed successfully in ${execTime} ms.`);

		return data;
	} catch (error) {
		const execTime = Math.round(performance.now() - start);

		this.logger.error(`[${queryId}] Query failed in ${execTime} ms. ERROR: ${(error as Error).message}`);

		throw error;
	}
}

export function setLoggerAndExecutor(
	pool: TExecutor,
	options?: {
		isLoggerEnabled?: boolean;
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
				values?: unknown[];
			}) => (await (queryLogged<T>).bind({ client: pool, logger: resultLogger })(sql.query, sql.values)),
			isLoggerEnabled: true,
			logger: resultLogger,
		};
	} else {
		return {
			executeSql: async <T extends pg.QueryResultRow>(sql: {
				query: string;
				values?: unknown[];
			}) => (await pool.query<T>(sql.query, sql.values)),
			isLoggerEnabled,
		};
	}
}
