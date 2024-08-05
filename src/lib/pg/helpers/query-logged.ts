import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";

export async function queryLogged<T extends pg.QueryResultRow>(
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
