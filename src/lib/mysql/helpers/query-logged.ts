import mysql from "mysql2/promise";

import * as SharedTypes from "../../../shared-types/index.js";

async function queryLogged<T extends (mysql.RowDataPacket | mysql.ResultSetHeader)>(
	this: {
		client: mysql.Pool | mysql.PoolConnection | mysql.Connection;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values?: unknown[],
) {
	const start = performance.now();

	try {
		const data = await this.client.query<T extends mysql.RowDataPacket ? T[] : T>(query, values);
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
	pool: mysql.Pool | mysql.PoolConnection | mysql.Connection,
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
			executeSql: async <T extends (mysql.RowDataPacket | mysql.ResultSetHeader)>(sql: {
				query: string;
				values?: unknown[];
			}) => (await (queryLogged<T>).bind({ client: pool, logger: resultLogger })(sql.query, sql.values)),
			isLoggerEnabled,
			logger: resultLogger,
		};
	} else {
		return {
			executeSql: async <T extends (mysql.RowDataPacket | mysql.ResultSetHeader)>(sql: {
				query: string;
				values?: unknown[];
			}) => (await pool.query<T extends mysql.RowDataPacket ? T[] : T>(sql.query, sql.values)),
			isLoggerEnabled,
		};
	}
}
