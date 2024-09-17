import mysql from "mysql2/promise";

import * as SharedTypes from "../../../shared-types/index.js";
import { QueryBuilder } from "./query-builder.js";

/**
 * Factory class to create instances of QueryBuilder.
 */
export class QueryBuilderFactory {
	#client: mysql.Pool | mysql.PoolConnection | mysql.Connection;
	#isLoggerEnabled;
	#logger?: SharedTypes.TLogger;

	/**
	 * Creates an instance of QueryBuilderFactory.
	 *
	 * @param client - The MySQL client or pool.
	 */
	constructor(
		client: mysql.Pool | mysql.PoolConnection | mysql.Connection,
		options?: {
			isLoggerEnabled?: true;
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
		client?: mysql.Pool | mysql.PoolConnection | mysql.Connection;
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
