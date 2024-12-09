import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import { QueryBuilder } from "./query-builder.js";

/**
 * Factory class to create instances of QueryBuilder.
 */
export class QueryBuilderFactory {
	#client: pg.Pool | pg.PoolClient | pg.Client;
	#isLoggerEnabled;
	#logger?: SharedTypes.TLogger;

	/**
	 * Creates an instance of QueryBuilderFactory.
	 *
	 * @param client - The PostgreSQL client or pool.
	 * @param [options] - Optional settings for the QueryBuilderFactory.
	 * @param [options.isLoggerEnabled] - Enable or disable logging.
	 * @param [options.logger] - Custom logger instance.
	 *
	 */
	constructor(
		client: pg.Pool | pg.PoolClient | pg.Client,
		options?: {
			isLoggerEnabled?: boolean;
			logger?: SharedTypes.TLogger;
		},
	) {
		this.#client = client;

		const { isLoggerEnabled, logger } = options || {};

		this.#isLoggerEnabled = isLoggerEnabled;

		if (isLoggerEnabled) {
			// eslint-disable-next-line no-console
			const resultLogger = logger || { error: console.error, info: console.log };

			this.#logger = resultLogger;
		}
	}

	/**
	 * Creates a new QueryBuilder instance.
	 *
	 * @param [options] - Optional parameters for the query builder.
	 * @param [options.client] - The database client to use for the query.
	 * @param [options.dataSource] - The name of the table, view, or materialized view
	 * that serves as the base for the SQL queries in the QueryBuilder. This clause is used to identify
	 * the primary data source for queries being constructed.
	 *
	 * @returns A new instance of QueryBuilder.
	 */
	createQueryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient | pg.Client;
		dataSource?: string;
	}): QueryBuilder {
		const { client, dataSource } = options || {};

		return new QueryBuilder(
			dataSource ?? "",
			client ?? this.#client,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);
	}
}
