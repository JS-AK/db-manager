import { Readable } from "node:stream";

import pg from "pg";

import * as Helpers from "../helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import queries from "./queries.js";

/**
 * @experimental
 * The `BaseMaterializedView` class provides methods to interact with and manage materialized views
 * in a PostgreSQL database. It includes functionality for querying, counting, and refreshing materialized views.
 */
export class BaseMaterializedView {
	#sortingOrders = new Set(["ASC", "DESC"]);
	#coreFieldsSet;
	#isLoggerEnabled: boolean | undefined;
	#logger?: SharedTypes.TLogger;
	#executeSql;
	#executeSqlStream: (sql: { query: string; values?: unknown[]; }) => Promise<Readable>;

	#initialArgs;

	/**
	 * The PostgreSQL executor.
	 * - pg.Pool
	 * - pg.PoolClient
	 * - pg.Client
	 */
	#executor: Types.TExecutor;

	/**
	 * The name of the materialized view.
	 */
	name: string;

	/**
	 * @type The core fields of the materialized view.
	 */
	coreFields: string[];

	/**
	 * Creates an instance of `BaseMaterializedView`.
	 *
	 * @param data - Data for initializing the materialized view.
	 * @param data.coreFields - The core fields of the materialized view.
	 * @param data.name - The name of the materialized view.
	 * @param [data.additionalSortingFields] - Additional fields allowed for sorting.
	 * @param dbCreds - Database credentials.
	 * @param [options] - Additional options.
	 */
	constructor(
		data: { additionalSortingFields?: string[]; coreFields: string[]; name: string; },
		dbCreds: Types.TDBCreds,
		options?: Types.TMVOptions,
	) {
		this.#executor = connection.getStandardPool(dbCreds);
		this.name = data.name;
		this.coreFields = data.coreFields;

		this.#coreFieldsSet = new Set([
			...this.coreFields,
			...(data.additionalSortingFields || []),
		] as const);

		this.#initialArgs = { data, dbCreds, options };

		const { isLoggerEnabled, logger } = options || {};

		const preparedOptions = Helpers.setLoggerAndExecutor(
			this.#executor,
			{ isLoggerEnabled, logger },
		);

		const { executeSqlStream } = Helpers.setStreamExecutor(
			this.#executor,
			{ isLoggerEnabled, logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#executeSqlStream = executeSqlStream;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Gets the database client for the materialized view.
	 *
	 * @returns The database client for the materialized view.
	 */
	get pool() {
		return this.#executor;
	}

	/**
	 * Gets the PostgreSQL executor for the materialized view.
	 *
	 * @returns The PostgreSQL executor for the materialized view.
	 */
	get executor() {
		return this.#executor;
	}

	/**
	 * Sets the logger for the materialized view.
	 *
	 * @param logger - The logger to use for the materialized view.
	 */
	setLogger(logger: SharedTypes.TLogger) {
		const preparedOptions = Helpers.setLoggerAndExecutor(
			this.#executor,
			{ isLoggerEnabled: true, logger },
		);

		const { executeSqlStream } = Helpers.setStreamExecutor(
			this.#executor,
			{ isLoggerEnabled: true, logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#executeSqlStream = executeSqlStream;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Sets the executor for the materialized view.
	 *
	 * @param executor - The executor to use for the materialized view.
	 */
	setExecutor(executor: Types.TExecutor) {
		const preparedOptions = Helpers.setLoggerAndExecutor(
			executor,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);

		const { executeSqlStream } = Helpers.setStreamExecutor(
			executor,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#executeSqlStream = executeSqlStream;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
		this.#executor = executor;
	}

	get isLoggerEnabled(): boolean | undefined {
		return this.#isLoggerEnabled;
	}

	get executeSql() {
		return this.#executeSql;
	}

	get executeSqlStream() {
		return this.#executeSqlStream;
	}

	/**
	 * Sets the client in the current class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns The current instance with the new connection client.
	 */
	setClientInCurrentClass(client: Types.TExecutor): this {
		return new (this.constructor as new (
			data: { additionalSortingFields?: string[]; coreFields: string[]; name: string; },
			dbCreds: Types.TDBCreds,
			options?: Types.TMVOptions,
		) => this)(
			{ ...this.#initialArgs.data },
			{ ...this.#initialArgs.dbCreds },
			{ ...this.#initialArgs.options, client },
		);
	}

	/**
	 * Sets the client in the base class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the base class with the new connection client.
	 */
	setClientInBaseClass(client: Types.TExecutor): BaseMaterializedView {
		return new BaseMaterializedView(
			{ ...this.#initialArgs.data },
			{ ...this.#initialArgs.dbCreds },
			{ ...this.#initialArgs.options, client },
		);
	}

	/**
	 * Compare fields for queries.
	 */
	compareFields = Helpers.compareFields;

	/**
	 * Get fields to search in queries.
	 */
	getFieldsToSearch = Helpers.getFieldsToSearch;

	/**
	 * Set of methods for generating comparison queries.
	 */
	compareQuery = {
		/**
		 * Generates a SQL query and values for selecting an array of records based on search parameters.
		 *
		 * @param params - Search parameters.
		 * @param params.$and - AND conditions for the search.
		 * @param [params.$or] - OR conditions for the search.
		 * @param [selected=["*"]] - Fields to be selected.
		 * @param [pagination] - Pagination details.
		 * @param [order] - Order by details.
		 * @param order.orderBy - Field to order by.
		 * @param order.ordering - Ordering direction ("ASC" or "DESC").
		 *
		 * @returns An object containing the query string and values array.
		 */
		getArrByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected: string[] = ["*"],
			pagination?: SharedTypes.TPagination,
			order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
		): { query: string; values: unknown[]; } => {
			if (order?.length) {
				for (const o of order) {
					if (!this.#coreFieldsSet.has(o.orderBy)) {
						const allowedFields = Array.from(this.#coreFieldsSet).join(", ");

						throw new Error(`Invalid orderBy: ${o.orderBy}. Allowed fields are: ${allowedFields}`);
					}

					if (!this.#sortingOrders.has(o.ordering)) { throw new Error("Invalid ordering"); }
				}
			}

			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, pagination, order);

			return {
				query: queries.getByParams(this.name, selectedFields, searchFields, orderByFields, paginationFields),
				values,
			};
		},
		/**
		 * Generates a SQL query and values for counting records based on search parameters.
		 *
		 * @param params - Search parameters.
		 * @param params.$and - AND conditions for the search.
		 * @param [params.$or] - OR conditions for the search.
		 *
		 * @returns An object containing the query string and values array.
		 */
		getCountByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			return {
				query: queries.getCountByParams(this.name, searchFields),
				values,
			};
		},
		/**
		 * Generates a SQL query and values for selecting a single record based on search parameters.
		 *
		 * @param params - Search parameters.
		 * @param params.$and - AND conditions for the search.
		 * @param [params.$or] - OR conditions for the search.
		 * @param [selected=["*"]] - Fields to be selected.
		 *
		 * @returns An object containing the query string and values array.
		 */
		getOneByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected: string[] = ["*"],
		): { query: string; values: unknown[]; } => {
			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, { limit: 1, offset: 0 });

			return {
				query: queries.getByParams(
					this.name,
					selectedFields,
					searchFields,
					orderByFields,
					paginationFields,
				),
				values,
			};
		},
		/**
		 * Generates a SQL query and values for selecting an array of records based on search parameters.
		 *
		 * @param params - Search parameters.
		 * @param params.$and - AND conditions for the search.
		 * @param [params.$or] - OR conditions for the search.
		 * @param [selected=["*"]] - Fields to be selected.
		 * @param [pagination] - Pagination details.
		 * @param [order] - Order by details.
		 * @param order.orderBy - Field to order by.
		 * @param order.ordering - Ordering direction ("ASC" or "DESC").
		 *
		 * @returns An object containing the query string and values array.
		 */
		streamArrByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected: string[] = ["*"],
			pagination?: SharedTypes.TPagination,
			order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
		): { query: string; values: unknown[]; } => {
			if (order?.length) {
				for (const o of order) {
					if (!this.#coreFieldsSet.has(o.orderBy)) {
						const allowedFields = Array.from(this.#coreFieldsSet).join(", ");

						throw new Error(`Invalid orderBy: ${o.orderBy}. Allowed fields are: ${allowedFields}`);
					}

					if (!this.#sortingOrders.has(o.ordering)) { throw new Error("Invalid ordering"); }
				}
			}

			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, pagination, order);

			return {
				query: queries.getByParams(this.name, selectedFields, searchFields, orderByFields, paginationFields),
				values,
			};
		},
	};

	/**
	 * Executes a query to get an array of records based on provided parameters.
	 *
	 * @param params - Search parameters.
	 * @param params.$and - AND conditions for the search.
	 * @param [params.$or] - OR conditions for the search.
	 * @param [selected=["*"]] - Fields to be selected.
	 * @param [pagination] - Pagination details.
	 * @param [order] - Order by details.
	 * @param order.orderBy - Field to order by.
	 * @param order.ordering - Ordering direction ("ASC" or "DESC").
	 *
	 * @returns A promise that resolves to an array of records.
	 */
	async getArrByParams<T extends pg.QueryResultRow>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected: string[] = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	): Promise<T[]> {
		const sql = this.compareQuery.getArrByParams(params, selected, pagination, order);
		const { rows } = await this.#executeSql<T>(sql);

		return rows;
	}

	/**
	 * Executes a query to count records based on provided parameters.
	 *
	 * @param params - Search parameters.
	 * @param params.$and - AND conditions for the search.
	 * @param [params.$or] - OR conditions for the search.
	 *
	 * @returns A promise that resolves to the count of records.
	 */
	async getCountByParams(params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; }): Promise<number> {
		const sql = this.compareQuery.getCountByParams(params);
		const { rows } = await this.executeSql<{ count: string; }>(sql);

		return Number(rows[0]?.count) || 0;
	}

	/**
	 * Executes a query to get a single record based on provided parameters.
	 *
	 * @param params - Search parameters.
	 * @param params.$and - AND conditions for the search.
	 * @param [params.$or] - OR conditions for the search.
	 * @param [selected=["*"]] - Fields to be selected.
	 *
	 * @returns A promise that resolves to a single record or undefined if no record is found.
	 */
	async getOneByParams<T extends pg.QueryResultRow>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected: string[] = ["*"],
	): Promise<T | undefined> {
		const sql = this.compareQuery.getOneByParams(params, selected);
		const { rows } = await this.#executeSql<T>(sql);

		return rows[0];
	}

	/**
	 * Refreshes the materialized view.
	 *
	 * @param [concurrently=false] - Whether to refresh the view concurrently.
	 *
	 * @returns A promise that resolves when the view is refreshed.
	 */
	async refresh(concurrently: boolean = false): Promise<void> {
		const query = `REFRESH MATERIALIZED VIEW ${concurrently ? "CONCURRENTLY" : ""} ${this.name}`;

		await this.#executeSql({ query });
	}

	/**
	 * Returns a stream of records from the database based on the provided search parameters.
	 * Useful for handling large result sets efficiently.
	 *
	 * @param params - Search parameters.
	 * @param params.$and - AND conditions for the search.
	 * @param [params.$or] - OR conditions for the search.
	 * @param [selected=["*"]] - Fields to be selected.
	 * @param [pagination] - Pagination details.
	 * @param [order] - Order by details.
	 * @param order.orderBy - Field to order by.
	 * @param order.ordering - Ordering direction ("ASC" or "DESC").
	 *
	 * @returns A promise that resolves to an array of records.
	 */
	async streamArrByParams<T extends pg.QueryResultRow>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected: string[] = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	): Promise<SharedTypes.ITypedPgStream<T>> {
		const sql = this.compareQuery.streamArrByParams(params, selected, pagination, order);

		return this.#executeSqlStream(sql);
	}

	/**
	 * Returns a new QueryBuilder instance for building SQL queries.
	 *
	 * @param [options] - Optional settings for the query builder.
	 * @param [options.client] - Optional database client or pool to use for query execution.
	 * @param [options.isLoggerEnabled] - Whether to enable logging for this query builder.
	 * @param [options.logger] - Optional custom logger instance.
	 * @param [options.name] - Optional materialized name to use (defaults to this.name).
	 *
	 * @returns A configured QueryBuilder instance.
	 */
	queryBuilder(options?: {
		client?: Types.TExecutor;
		isLoggerEnabled?: boolean;
		logger?: SharedTypes.TLogger;
		name?: string;
	}): QueryBuilder {
		const { client, isLoggerEnabled, logger, name } = options || {};

		return new QueryBuilder(
			name ?? this.name,
			client ?? this.#executor,
			{
				isLoggerEnabled: isLoggerEnabled ?? this.#isLoggerEnabled,
				logger: logger ?? this.#logger,
			},
		);
	}

	// STATIC METHODS

	/**
	 * Gets a standard connection pool.
	 *
	 * @static
	 * @param creds - Database credentials.
	 * @param [poolName] - Optional pool name.
	 *
	 * @returns A new PostgreSQL connection pool.
	 */
	static getStandardPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return connection.getStandardPool(creds, poolName);
	}

	/**
	 * Removes a standard connection pool.
	 *
	 * @static
	 * @param creds - Database credentials.
	 * @param [poolName] - Optional pool name.
	 *
	 * @returns A promise that resolves when the pool is removed.
	 */
	static async removeStandardPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeStandardPool(creds, poolName);
	}

	/**
	 * Gets a transaction connection pool.
	 *
	 * @static
	 * @param creds - Database credentials.
	 * @param [poolName] - Optional pool name.
	 *
	 * @returns A new PostgreSQL transaction connection pool.
	 */
	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return connection.getTransactionPool(creds, poolName);
	}

	/**
	 * Removes a transaction connection pool.
	 *
	 * @static
	 * @param creds - Database credentials.
	 * @param [poolName] - Optional pool name.
	 *
	 * @returns A promise that resolves when the pool is removed.
	 */
	static async removeTransactionPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeTransactionPool(creds, poolName);
	}
}
