import pg from "pg";

import * as DomainTypes from "../domain/types.js";
import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";
import { QueryHandler } from "./query-handler.js";

export class QueryBuilder {
	#dataSourceRaw;
	#dataSourcePrepared;

	#client;
	#queryHandler;

	constructor(
		dataSource: string,
		client: pg.Pool | pg.PoolClient,
		queryHandler?: QueryHandler,
	) {
		this.#dataSourceRaw = dataSource;

		const chunks = dataSource.toLowerCase().split(" ").filter((e) => e && e !== "as");
		const as = chunks[1]?.trim();

		if (as) {
			this.#dataSourcePrepared = as;
		} else {
			this.#dataSourcePrepared = dataSource;
		}

		this.#queryHandler = queryHandler || new QueryHandler({
			dataSourcePrepared: this.#dataSourcePrepared,
			dataSourceRaw: this.#dataSourceRaw,
		});

		this.#client = client;
	}

	clone() {
		const main = new QueryHandler(this.#queryHandler.optionsToClone);

		return new QueryBuilder(this.#dataSourceRaw, this.#client, main);
	}

	compareQuery(): { query: string; values: unknown[]; } {
		return this.#queryHandler.compareQuery();
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * If the `#for` property is not set, it initializes it with "FOR " unless the `data` string starts with "FOR" (case-insensitive).
	 * The processed or original data is then appended to the `#for` property.
	 *
	 * @param {string} data - The string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
	 */
	rawFor(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawFor(data, values);

		return this;
	}

	delete() {
		this.#queryHandler.delete();

		return this;
	}

	insert<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T | T[];
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		this.#queryHandler.insert<T>(options);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing placeholders with values from the `values` array.
	 * The processed or original data is then used to set the `#mainQuery` property with an `INSERT INTO` clause.
	 *
	 * This method does not return any value.
	 *
	 * @param {string} data - The string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
	 */
	rawInsert(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawInsert(data, values);

		return this;
	}

	update<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T;
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		this.#queryHandler.update<T>(options);

		return this;
	}

	select(data: string[]) {
		this.#queryHandler.select(data);

		return this;
	}

	from(data: string) {
		this.#queryHandler.from(data);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * The processed or original data is then appended to the `#join` array.
	 *
	 * @param {string} data - The string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
	 */
	rawJoin(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawJoin(data, values);

		return this;
	}

	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.rightJoin(data);

		return this;
	}

	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.leftJoin(data);

		return this;
	}

	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.innerJoin(data);

		return this;
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.fullOuterJoin(data);

		return this;
	}

	where<T extends ModelTypes.TSearchParams>(data: {
		params?: ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>>;
	}) {
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
	 * @param {Object} data - The object containing the name and query to be processed.
	 * @param {string} data.name - The name or alias to be used in the `WITH` clause.
	 * @param {string} data.query - The query string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data.query` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
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
	 * @param {string} data - The string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
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
	 * @param {string} data - The string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
	 */
	rawUpdate(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawUpdate(data, values);

		return this;
	}

	pagination(data: { limit: number; offset: number; }) {
		this.#queryHandler.pagination(data);

		return this;
	}

	orderBy(data: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]) {
		this.#queryHandler.orderBy(data);

		return this;
	}

	groupBy(data: string[]) {
		this.#queryHandler.groupBy(data);

		return this;
	}

	having<T extends ModelTypes.TSearchParams>(data: {
		params?: ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>>;
	}) {
		this.#queryHandler.having(data);

		return this;
	}

	/**
	 * Processes the input string `data`, optionally replacing all occurrences of `$?` with values from the `values` array.
	 * If the `#mainHaving` property is not set, it initializes it with "HAVING " unless the `data` string starts with "HAVING" (case-insensitive).
	 * The processed or original data is then appended to the `#mainHaving` property.
	 *
	 * @param {string} data - The string to be processed and potentially replaced.
	 * @param {unknown[]} [values] - An optional array of values to replace placeholders in the `data` string.
	 *
	 * @returns {QueryBuilder} The `QueryBuilder` instance to allow for method chaining.
	 */
	rawHaving(data: string, values?: unknown[]): QueryBuilder {
		this.#queryHandler.rawHaving(data, values);

		return this;
	}

	returning(data: string[]) {
		this.#queryHandler.returning(data);

		return this;
	}

	async execute<T extends pg.QueryResultRow>() {
		const sql = this.compareQuery();

		return (await this.#client.query<T>(sql.query, sql.values)).rows;
	}
}
