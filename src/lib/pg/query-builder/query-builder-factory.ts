import pg from "pg";

import { QueryBuilder } from "./query-builder.js";

/**
 * Factory class to create instances of QueryBuilder.
 */
export class QueryBuilderFactory {
	#client: pg.Pool | pg.PoolClient;

	/**
	 * Creates an instance of QueryBuilderFactory.
	 *
	 * @param {pg.Pool | pg.PoolClient} client - The PostgreSQL client or pool.
	 */
	constructor(client: pg.Pool | pg.PoolClient) {
		this.#client = client;
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

		return new QueryBuilder(dataSource ?? "", client ?? this.#client);
	}
}
