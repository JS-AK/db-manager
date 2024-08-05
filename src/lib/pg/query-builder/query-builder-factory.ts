import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import { QueryBuilder } from "./query-builder.js";

/**
 * Factory class to create instances of QueryBuilder.
 */
export class QueryBuilderFactory {
	#client: pg.Pool | pg.PoolClient;
	#isLoggerEnabled?: boolean;
	#logger?: SharedTypes.TLogger;

	/**
	 * Creates an instance of QueryBuilderFactory.
	 *
	 * @param {pg.Pool | pg.PoolClient} client - The PostgreSQL client or pool.
	 */
	constructor(
		client: pg.Pool | pg.PoolClient,
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
	 * @param {Object} [options] - Optional parameters for the query builder.
	 * @param {pg.Pool|pg.PoolClient} [options.client] - The database client to use for the query.
	 * @param {string} [options.dataSource] - The name of the table, view, or materialized view
	 * that serves as the base for the SQL queries in the QueryBuilder. This clause is used to identify
	 * the primary data source for queries being constructed.
	 *
	 * @returns {QueryBuilder} A new instance of QueryBuilder.
	 */
	createQueryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient;
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
