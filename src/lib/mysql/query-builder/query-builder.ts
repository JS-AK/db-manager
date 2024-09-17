import mysql from "mysql2/promise";

import * as DomainTypes from "../domain/types.js";
import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";
import { QueryHandler } from "./query-handler.js";
import { setLoggerAndExecutor } from "../helpers/index.js";

/**
 * A class to build and execute SQL queries using a fluent API.
 * The `QueryBuilder` handles various SQL operations like SELECT, INSERT, UPDATE, DELETE, and JOINs,
 * as well as raw SQL query construction and execution.
 */
export class QueryBuilder {
	#dataSourceRaw;
	#dataSourcePrepared;

	#client;
	#queryHandler;
	#logger?: SharedTypes.TLogger;
	#executeSql;

	/**
	 * Creates an instance of QueryBuilder.
	 *
	 * @param dataSource - The raw SQL data source string.
	 * @param client - The MySQL client or connection pool.
	 * @param [options] - Optional settings for the QueryBuilder.
	 * @param [options.isLoggerEnabled=true] - Enable or disable logging.
	 * @param [options.logger] - Custom logger instance.
	 * @param [options.queryHandler] - Custom query handler instance.
	 */
	constructor(
		dataSource: string,
		client: mysql.Pool | mysql.PoolConnection | mysql.Connection,
		options?: {
			isLoggerEnabled?: true;
			logger?: SharedTypes.TLogger;
			queryHandler?: QueryHandler;
		},
	) {
		this.#dataSourceRaw = dataSource;
		this.#client = client;

		const chunks = dataSource.toLowerCase().split(" ").filter((e) => e && e !== "as");
		const as = chunks[1]?.trim();

		if (as) {
			this.#dataSourcePrepared = as;
		} else {
			this.#dataSourcePrepared = dataSource;
		}

		const { isLoggerEnabled, logger, queryHandler } = options || {};

		this.#queryHandler = queryHandler || new QueryHandler({
			dataSourcePrepared: this.#dataSourcePrepared,
			dataSourceRaw: this.#dataSourceRaw,
		});

		const preparedOptions = setLoggerAndExecutor(
			this.#client,
			{ isLoggerEnabled, logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Indicates if the current query is a subquery.
	 *
	 */
	get isSubquery(): boolean {
		return this.#queryHandler.isSubquery;
	}

	/**
	 * Creates a deep copy of the current QueryBuilder instance.
	 *
	 * @returns A new QueryBuilder instance cloned from the current one.
	 */
	clone() {
		const queryHandler = new QueryHandler(this.#queryHandler.optionsToClone);

		return new QueryBuilder(this.#dataSourceRaw, this.#client, { logger: this.#logger, queryHandler });
	}

	/**
	 * Compares and generates the SQL query and its values.
	 *
	 * @returns An object containing the SQL query string and its values.
	 */
	compareQuery(): { query: string; values: unknown[]; } {
		return this.#queryHandler.compareQuery();
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * If the `#for` property is not set, it initializes it with "FOR " unless the `data` string starts with "FOR" (case-insensitive).
	 * The processed or original data is then appended to the `#for` property.
	 *
	 * @param data - The string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	rawFor(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawFor(data, values);

		return this;
	}

	/**
	 * Deletes records from the database.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	delete(): QueryBuilder {
		this.#queryHandler.delete();

		return this;
	}

	/**
	 * Inserts records into the database.
	 *
	 * @param options - The options for the insert operation.
	 * @param [options.onConflict] - Conflict resolution strategy.
	 * @param options.params - The parameters to insert.
	 * @param [options.updateColumn] - Optional default system column for updates.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	insert<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T | T[];
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}): QueryBuilder {
		this.#queryHandler.insert<T>(options);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing placeholders with values from the `values` array.
	 * The processed or original data is then used to set the `#mainQuery` property with an `INSERT INTO` clause.
	 *
	 * This method does not return any value.
	 *
	 * @param data - The string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	rawInsert(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawInsert(data, values);

		return this;
	}

	/**
	 * Updates records in the database.
	 *
	 * @param options - The options for the update operation.
	 * @param [options.onConflict] - Conflict resolution strategy.
	 * @param options.params - The parameters to update.
	 * @param [options.updateColumn] - Optional default system column for updates.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	update<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T;
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}): QueryBuilder {
		this.#queryHandler.update<T>(options);

		return this;
	}

	/**
	 * Specifies the columns to select in the SQL query.
	 *
	 * @param data - An array of column names to select.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	select(data: string[]): QueryBuilder {
		this.#queryHandler.select(data);

		return this;
	}

	/**
	 * Specifies the data source for the SQL query.
	 *
	 * @param data - The data source, either as a string or another QueryBuilder instance.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 * @throws {Error} If the `data` is a QueryBuilder instance but not a subquery.
	 */
	from(data: string | QueryBuilder, values?: unknown[]): QueryBuilder {
		if (data instanceof QueryBuilder) {
			if (!data.isSubquery) {
				throw new Error("data must be a query builder subquery");
			}

			const { query, values } = data.compareQuery();

			this.#queryHandler.from(query, values);

			return this;
		} else {
			this.#queryHandler.from(data, values);

			return this;
		}
	}

	/**
	 * Converts the current query into a subquery.
	 *
	 * @param [name] - An optional name for the subquery.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	toSubquery(name?: string): QueryBuilder {
		this.#queryHandler.toSubquery(name);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * The processed or original data is then appended to the `#join` array.
	 *
	 * @param data - The string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	rawJoin(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawJoin(data, values);

		return this;
	}

	/**
	 * Specifies a `RIGHT JOIN` clause in the SQL query.
	 *
	 * @param data - The data for the `RIGHT JOIN` clause.
	 * @param data.targetTableName - The name of the table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): QueryBuilder {
		this.#queryHandler.rightJoin(data);

		return this;
	}

	/**
	 * Specifies a `LEFT JOIN` clause in the SQL query.
	 *
	 * @param data - The data for the `LEFT JOIN` clause.
	 * @param data.targetTableName - The name of the table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): QueryBuilder {
		this.#queryHandler.leftJoin(data);

		return this;
	}

	/**
	 * Specifies an `INNER JOIN` clause in the SQL query.
	 *
	 * @param data - The data for the `INNER JOIN` clause.
	 * @param data.targetTableName - The name of the table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): QueryBuilder {
		this.#queryHandler.innerJoin(data);

		return this;
	}

	/**
	 * Specifies a `FULL OUTER JOIN` clause in the SQL query.
	 *
	 * @param data - The data for the `FULL OUTER JOIN` clause.
	 * @param data.targetTableName - The name of the table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): QueryBuilder {
		this.#queryHandler.fullOuterJoin(data);

		return this;
	}

	/**
	 * Specifies a `WHERE` clause for the SQL query.
	 *
	 * @param data - The data for the `WHERE` clause.
	 * @param [data.params] - Search parameters for the `WHERE` clause.
	 * @param [data.paramsOr] - Optional OR conditions for the `WHERE` clause.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	where<T extends ModelTypes.TSearchParams>(data: {
		params?: ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>;
		paramsOr?: (ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>)[];
	}): QueryBuilder {
		this.#queryHandler.where(data);

		return this;
	}

	/**
	 * Processes the input object `data`, which contains a `query` string, and optionally replaces placeholders with values from the `values` array.
	 * It then formats the processed query as part of a `WITH` clause. The formatted clause is appended to the `#with` property,
	 * ensuring that multiple clauses are separated by commas.
	 *
	 * If the `#with` property is not set, it initializes it with the `WITH` clause; otherwise, it appends additional clauses.
	 *
	 * @param data - The object containing the name and query to be processed.
	 * @param data.name - The name or alias to be used in the `WITH` clause.
	 * @param data.query - The query string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data.query` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	with(data: { name: string; query: string; }, values?: unknown[]): QueryBuilder {
		this.#queryHandler.with(data, values);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * If the `#mainWhere` property is not set, it initializes it with "WHERE " unless the `data` string starts with "WHERE" (case-insensitive).
	 * The processed or original data is then appended to the `#mainWhere` property.
	 *
	 * @param data - The string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	rawWhere(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawWhere(data, values);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing placeholders with values from the `values` array.
	 * If the `#mainQuery` property is not set, it initializes it with an `UPDATE` clause, unless the `data` string starts with "UPDATE" (case-insensitive).
	 * The processed or original data is then appended to the `#mainQuery` property.
	 *
	 * This method does not return any value.
	 *
	 * @param data - The string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	rawUpdate(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawUpdate(data, values);

		return this;
	}

	/**
	 * Specifies pagination for the SQL query.
	 *
	 * @param [data] - The data for pagination.
	 * @param [data].limit - The maximum number of rows to return.
	 * @param [data].offset - The number of rows to skip before starting to return rows.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	pagination(data?: { limit: number; offset: number; }): QueryBuilder {
		if (!data) return this;

		this.#queryHandler.pagination(data);

		return this;
	}

	/**
	 * Specifies an `ORDER BY` clause for the SQL query.
	 *
	 * @param [data] - An array of objects specifying the columns and sorting order.
	 * @param [data][].column - The column name to order by.
	 * @param [data][].sorting - The sorting direction (`ASC` or `DESC`).
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	orderBy(data?: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]): QueryBuilder {
		if (!data?.length) return this;

		this.#queryHandler.orderBy(data);

		return this;
	}

	/**
	 * Specifies a `GROUP BY` clause for the SQL query.
	 *
	 * @param [data] - An array of column names to group by.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	groupBy(data?: string[]): QueryBuilder {
		if (!data?.length) return this;

		this.#queryHandler.groupBy(data);

		return this;
	}

	/**
	 * Specifies a `HAVING` clause for the SQL query.
	 *
	 * @param data - The data for the `HAVING` clause.
	 * @param [data.params] - Search parameters for the `HAVING` clause.
	 * @param [data.paramsOr] - Optional OR conditions for the `HAVING` clause.
	 *
	 * @returns The current QueryBuilder instance for method chaining.
	 */
	having<T extends ModelTypes.TSearchParams>(data: {
		params?: ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>;
		paramsOr?: (ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>)[];
	}): QueryBuilder {
		this.#queryHandler.having(data);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * If the `#mainHaving` property is not set, it initializes it with "HAVING " unless the `data` string starts with "HAVING" (case-insensitive).
	 * The processed or original data is then appended to the `#mainHaving` property.
	 *
	 * @param data - The string to be processed and potentially replaced.
	 * @param [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns The `QueryBuilder` instance to allow for method chaining.
	 */
	rawHaving(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawHaving(data, values);

		return this;
	}

	/**
	 * Executes the SQL query and returns the result.
	 *
	 * @returns A promise that resolves to an array of result rows.
	 */
	async execute<T>(): Promise<T extends mysql.ResultSetHeader ? T : T[]> {
		const sql = this.compareQuery();

		const [rows] = await this.#executeSql<T extends mysql.ResultSetHeader ? T : T & mysql.RowDataPacket>(sql);

		return rows as T extends mysql.ResultSetHeader ? T : T[];
	}

	/**
	 * Executes a SQL custom query with specified data and values, and returns the result.
	 *
	 * This method executes a SQL query provided as a string with optional parameter values, and returns the result rows.
	 *
	 * @note All previously passed options are ignored.
	 *
	 * @param data - The SQL query string to execute.
	 * @param [values=[]] - Optional array of values to be used in the query.
	 *
	 * @returns A promise that resolves to an array of result rows.
	 */
	async executeRawQuery<T>(data: string, values?: unknown[]): Promise<T extends mysql.ResultSetHeader ? T : T[]> {
		const [rows] = await this.#executeSql<T extends mysql.ResultSetHeader ? T : T & mysql.RowDataPacket>({ query: data, values });

		return rows as T extends mysql.ResultSetHeader ? T : T[];
	}
}
