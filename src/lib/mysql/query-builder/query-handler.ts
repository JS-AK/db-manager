import * as Helpers from "../helpers/index.js";
import * as ModelTypes from "../model/types.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import { generateTimestampQuery } from "../model/queries.js";

/**
 * Class to handle SQL query construction.
 */
export class QueryHandler {
	#groupBy = "";
	#join: string[] = [];
	#subqueryName = "";
	#mainHaving = "";
	#mainQuery = "";
	#mainWhere = "";
	#orderBy = "";
	#pagination = "";
	#for = "";
	#dataSourcePrepared;
	#dataSourceRaw;
	#values: unknown[] = [];
	#with = "";

	isSubquery = false;

	/**
	 * Constructs a new QueryHandler instance.
	 *
	 * @param options - The configuration options.
	 * @param [options.groupBy] - Group by clause.
	 * @param [options.join] - Array of join clauses.
	 * @param [options.isSubquery] - Whether this is a subquery.
	 * @param [options.mainHaving] - Having clause.
	 * @param [options.mainQuery] - Main query string.
	 * @param [options.mainWhere] - Where clause.
	 * @param [options.orderBy] - Order by clause.
	 * @param [options.pagination] - Pagination clause.
	 * @param options.dataSourcePrepared - Prepared data source name.
	 * @param options.dataSourceRaw - Raw data source name.
	 * @param [options.values] - Array of values to be used in the query.
	 * @param [options.with] - With clause for common table expressions.
	 */
	constructor(options: {
		groupBy?: string;
		join?: string[];
		isSubquery?: boolean;
		mainHaving?: string;
		mainQuery?: string;
		mainWhere?: string;
		orderBy?: string;
		pagination?: string;
		dataSourcePrepared: string;
		dataSourceRaw: string;
		values?: unknown[];
		with?: string;
	}) {
		if (options.groupBy) this.#groupBy = options.groupBy;
		if (options.join) this.#join = options.join;
		if (options.isSubquery) this.isSubquery = options.isSubquery;
		if (options.mainHaving) this.#mainHaving = options.mainHaving;
		if (options.mainQuery) this.#mainQuery = options.mainQuery;
		if (options.mainWhere) this.#mainWhere = options.mainWhere;
		if (options.orderBy) this.#orderBy = options.orderBy;
		if (options.pagination) this.#pagination = options.pagination;
		if (options.values) this.#values = options.values;
		if (options.with) this.#with = options.with;

		this.#dataSourceRaw = options.dataSourceRaw;
		this.#dataSourcePrepared = options.dataSourcePrepared;
	}

	/**
	 * Get the options to clone the current query.
	 *
	 * @returns Clonable options.
	 */
	get optionsToClone() {
		return {
			dataSourcePrepared: this.#dataSourcePrepared,
			dataSourceRaw: this.#dataSourceRaw,
			groupBy: this.#groupBy,
			join: [...this.#join],
			mainHaving: this.#mainHaving,
			mainQuery: this.#mainQuery,
			mainWhere: this.#mainWhere,
			orderBy: this.#orderBy,
			pagination: this.#pagination,
			values: structuredClone(this.#values),
			with: this.#with,
		};
	}

	/**
	 * Constructs and returns a SQL query string based on the provided query components.
	 *
	 * The method assembles the SQL query by concatenating various parts such as `WITH` clause,
	 * main query, JOIN clauses, WHERE clause, GROUP BY clause, HAVING clause, ORDER BY clause,
	 * pagination and FOR clause. It handles the case where the query is a
	 * subquery by wrapping the query in parentheses and optionally naming the subquery.
	 *
	 * @private
	 *
	 * @returns The assembled SQL query string. If the query is a subquery, it will be
	 * enclosed in parentheses and optionally followed by an alias name. Otherwise, the query
	 * will end with a semicolon.
	 */
	#compareSql(): string {
		const query = (
			(this.#with ? this.#with + " " : "")
			+ (this.#mainQuery ?? "")
			+ (this.#join.length ? " " + this.#join.join(" ") : "")
			+ (this.#mainWhere ? " " + this.#mainWhere : "")
			+ (this.#groupBy ? " " + this.#groupBy : "")
			+ (this.#mainHaving ? " " + this.#mainHaving : "")
			+ (this.#orderBy ? " " + this.#orderBy : "")
			+ (this.#pagination ? " " + this.#pagination : "")
			+ (this.#for ? " " + this.#for : "")
		);

		return this.isSubquery
			? `(${query})${this.#subqueryName ? ` AS ${this.#subqueryName}` : ""}`
			: query + ";";
	}

	/**
	 * Counts the number of question mark placeholders in the SQL query.
	 *
	 * @param text - The text containing placeholders.
	 *
	 * @returns The number of question mark placeholders.
	 */
	#countQuestionMarks(text: string): number {
		const regex = /\?/g;
		const matches = text.match(regex);

		return matches ? matches.length : 0;
	}

	/**
	 * Processes the provided data with the corresponding values.
	 *
	 * @param data - The SQL clause data.
	 * @param values - The values to be used in the SQL clause.
	 *
	 * @returns The processed SQL clause.
	 *
	 * @throws {Error} If the number of placeholders doesn't match the values length.
	 */
	#processDataWithValues(data: string, values: unknown[]): string {
		const growth = this.#countQuestionMarks(data);

		if (growth !== values.length) {
			throw new Error(`${data} - Invalid values: ${JSON.stringify(values)}`);
		}

		this.#values.push(...values);

		return data;
	}

	/**
	 * Constructs and returns an object containing the SQL query string and its associated values.
	 *
	 * The method generates the SQL query string by invoking the `#compareSql` method, and returns
	 * an object that includes the query string and the associated parameter values.
	 *
	 * @returns An object containing the SQL query string
	 * and the array of values to be used as parameters in the query.
	 */
	compareQuery(): { query: string; values: unknown[]; } {
		return { query: this.#compareSql(), values: this.#values };
	}

	/**
	 * Adds a raw SQL `FOR` clause to the query.
	 *
	 * This method adds the given raw SQL data to the `FOR` clause of the query. If the provided
	 * string does not start with "FOR", it will prepend "FOR " to the data. The method also
	 * handles any placeholder values within the data string, processing them accordingly.
	 *
	 * @param data - The raw SQL data to be added to the `FOR` clause.
	 * @param [values] - An optional array of values to replace placeholders in the
	 * data string.
	 *
	 * @returns
	 */
	rawFor(
		data: string,
		values?: unknown[],
	): void {
		if (!data) return;

		if (!this.#for) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 3) !== "for") {
				this.#for = "FOR ";
			}
		}

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#for += ` ${dataPrepared}`;
	}

	/**
	 * Sets the main SQL query to a DELETE statement.
	 *
	 * This method sets the main part of the query to a `DELETE FROM` statement, targeting the
	 * specified data source.
	 *
	 * @returns
	 */
	delete(): void {
		this.#mainQuery = `DELETE FROM ${this.#dataSourceRaw}`;
	}

	/**
	 * Constructs and sets an SQL INSERT query with optional conflict handling and timestamp updates.
	 *
	 * This method builds an SQL INSERT statement based on the provided parameters. It supports batch inserts,
	 * conflict handling using the `onConflict` option, and automatic updates of timestamp columns if specified.
	 *
	 * @param options - Options for constructing the INSERT query.
	 * @param options.params - The parameters for the INSERT operation, which can be a single object or an array of objects.
	 * @param [options.onConflict] - Optional SQL clause to handle conflicts, typically used to specify `ON CONFLICT DO UPDATE`.
	 * @param [options.updateColumn] -
	 * An optional object specifying a column to update with the current timestamp. The `title` is the column name,
	 * and `type` specifies the format (either `timestamp` or `unix_timestamp`).
	 *
	 * @returns
	 *
	 * @throws {Error} Throws an error if parameters are invalid or if fields are undefined.
	 */
	insert<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T | T[];
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}): void {
		const v = [];
		const k = [];
		const headers = new Set<string>();

		let insertQuery = "";

		if (Array.isArray(options.params)) {
			const [example] = options.params;

			if (!example) throw new Error("Invalid parameters");

			const params = SharedHelpers.clearUndefinedFields(example);

			Object.keys(params).forEach((e) => headers.add(e));

			for (const pR of options.params) {
				const params = SharedHelpers.clearUndefinedFields(pR);
				const keys = Object.keys(params);

				if (!keys.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(pR).join(", ")}`);

				for (const key of keys) {
					if (!headers.has(key)) {
						throw new Error(`Invalid params, all fields are undefined - ${Object.keys(pR).join(", ")}`);
					}
				}

				v.push(...Object.values(params));

				if (options.updateColumn) {
					keys.push(`${options.updateColumn.title} = ${generateTimestampQuery(options.updateColumn.type)}`);
				}

				k.push(keys);
			}

			insertQuery += k.map((e) => e.map(() => "?")).join("),(");
		} else {
			const params = SharedHelpers.clearUndefinedFields(options.params);

			Object.keys(params).forEach((e) => { headers.add(e); k.push(e); });
			v.push(...Object.values(params));

			if (!headers.size) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(options.params).join(", ")}`);

			if (options.updateColumn) {
				k.push(`${options.updateColumn.title} = ${generateTimestampQuery(options.updateColumn.type)}`);
			}

			insertQuery += k.map(() => "?").join(",");
		}

		this.#mainQuery = `INSERT INTO ${this.#dataSourceRaw}(${Array.from(headers).join(",")}) VALUES(${insertQuery})`;

		if (options.onConflict) this.#mainQuery += ` ${options.onConflict}`;

		this.#values.push(...v);
	}

	/**
	 * Constructs and sets a raw SQL INSERT query with optional value substitution.
	 *
	 * This method allows inserting raw SQL data into the specified data source. If values are provided,
	 * they are substituted into the SQL string using the internal value processing method.
	 *
	 * @param data - The raw SQL data string to be inserted.
	 * @param [values] - Optional array of values to be substituted into the SQL string.
	 *
	 * @returns
	 */
	rawInsert(
		data: string,
		values?: unknown[],
	): void {
		if (!data) return;

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#mainQuery = `INSERT INTO ${this.#dataSourceRaw} ${dataPrepared}`;
	}

	/**
	 * Constructs and sets an SQL UPDATE query with optional conflict handling and timestamp updates.
	 *
	 * This method builds an SQL UPDATE statement based on the provided parameters. It supports
	 * automatic updates of timestamp columns if specified and optional conflict handling.
	 *
	 * @param options - Options for constructing the UPDATE query.
	 * @param options.params - The parameters for the UPDATE operation, which is a single object.
	 * @param [options.onConflict] - Optional SQL clause to handle conflicts, typically used to specify `ON CONFLICT DO UPDATE`.
	 * @param [options.updateColumn] -
	 * An optional object specifying a column to update with the current timestamp. The `title` is the column name,
	 * and `type` specifies the format (either `timestamp` or `unix_timestamp`).
	 *
	 * @returns
	 *
	 * @throws {Error} Throws an error if parameters are invalid or if fields are undefined.
	 */
	update<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T;
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}): void {
		const params = SharedHelpers.clearUndefinedFields(options.params);
		const k = Object.keys(params);
		const v = Object.values(params);

		if (!k.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(options.params).join(", ")}`);

		let updateQuery = k.map((e: string) => `${e} = ?`).join(",");

		if (options.updateColumn) {
			updateQuery += `, ${options.updateColumn.title} = ${generateTimestampQuery(options.updateColumn.type)}`;
		}

		this.#mainQuery = `UPDATE ${this.#dataSourceRaw} SET ${updateQuery}`;

		if (options.onConflict) this.#mainQuery += ` ${options.onConflict}`;

		this.#values.push(...v);
	}

	/**
	 * Constructs and sets a raw SQL UPDATE query with optional value substitution.
	 *
	 * This method allows updating raw SQL data in the specified data source. If values are provided,
	 * they are substituted into the SQL string using the internal value processing method. The method
	 * also ensures that the query starts with an `UPDATE` clause if it hasn't been set.
	 *
	 * @param data - The raw SQL data string to be updated.
	 * @param [values] - Optional array of values to be substituted into the SQL string.
	 *
	 * @returns
	 */
	rawUpdate(
		data: string,
		values?: unknown[],
	): void {
		if (!data) return;

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		if (!this.#mainQuery) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 6) !== "UPDATE") {
				this.#mainQuery = `UPDATE ${this.#dataSourceRaw} SET`;
			}

			this.#mainQuery += ` ${dataPrepared}`;

			return;
		}

		this.#mainQuery += `, ${dataPrepared}`;

		return;
	}

	/**
	 * Constructs and sets an SQL SELECT query.
	 *
	 * This method builds an SQL SELECT statement based on the provided column names.
	 * The `FROM` clause is automatically appended using the internal data source.
	 *
	 * @param data - An array of column names to select from the data source.
	 *
	 * @returns
	 */
	select(data: string[]): void {
		const fromClause = this.#dataSourceRaw
			? ` FROM ${this.#dataSourceRaw}`
			: "";

		this.#mainQuery = `SELECT ${data.join(", ")}${fromClause}`;
	}

	/**
	 * Sets the source table for the query and optionally processes values for the SQL string.
	 *
	 * This method updates the internal data source (`#dataSourceRaw`) and adjusts the current SQL
	 * query to include the `FROM` clause. It also extracts and prepares the alias for the data source, if present.
	 *
	 * @param data - The table name or SQL string specifying the data source.
	 * @param [values] - Optional array of values to be substituted into the SQL string.
	 *
	 * @returns
	 */
	from(
		data: string,
		values?: unknown[],
	): void {
		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#dataSourceRaw = dataPrepared;

		const [firstClause, fromClause] = this.#mainQuery.split(" FROM ");

		if (fromClause) {
			this.#mainQuery = `${firstClause} FROM ${this.#dataSourceRaw}`;
		} else {
			this.#mainQuery = `${this.#mainQuery} FROM ${this.#dataSourceRaw}`;
		}

		const chunks = dataPrepared
			.toLowerCase()
			.split(" ")
			.filter((e) => e && e !== "as");

		const as = chunks[1]?.trim();

		if (as) {
			this.#dataSourcePrepared = as;
		} else {
			this.#dataSourcePrepared = dataPrepared;
		}
	}

	/**
	 * Appends a raw SQL JOIN clause to the current query with optional value substitution.
	 *
	 * This method allows adding any type of JOIN clause to the SQL query. If values are provided,
	 * they are substituted into the SQL string using the internal value processing method.
	 *
	 * @param data - The raw SQL JOIN clause to be appended.
	 * @param [values] - Optional array of values to be substituted into the SQL string.
	 *
	 * @returns
	 */
	rawJoin(
		data: string,
		values?: unknown[],
	): void {
		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#join.push(dataPrepared);
	}

	/**
	 * Appends a RIGHT JOIN clause to the current SQL query.
	 *
	 * This method constructs and appends a RIGHT JOIN clause, using the specified table and field names.
	 * It supports table aliasing and defaults to the main data source if the initial table is not provided.
	 *
	 * @param data - The details for constructing the RIGHT JOIN clause.
	 * @param data.targetTableName - The name of the target table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table, defaults to the main data source.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns
	 */
	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): void {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`RIGHT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	/**
	 * Appends a LEFT JOIN clause to the current SQL query.
	 *
	 * This method constructs and appends a LEFT JOIN clause, using the specified table and field names.
	 * It supports table aliasing and defaults to the main data source if the initial table is not provided.
	 *
	 * @param data - The details for constructing the LEFT JOIN clause.
	 * @param data.targetTableName - The name of the target table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table, defaults to the main data source.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns
	 */
	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): void {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`LEFT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	/**
	 * Appends an INNER JOIN clause to the current SQL query.
	 *
	 * This method constructs and appends an INNER JOIN clause, using the specified table and field names.
	 * It supports table aliasing and defaults to the main data source if the initial table is not provided.
	 *
	 * @param data - The details for constructing the INNER JOIN clause.
	 * @param data.targetTableName - The name of the target table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table, defaults to the main data source.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns
	 */
	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): void {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`INNER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	/**
	 * Appends a FULL OUTER JOIN clause to the current SQL query.
	 *
	 * This method constructs and appends a FULL OUTER JOIN clause, using the specified table and field names.
	 * It supports table aliasing and defaults to the main data source if the initial table is not provided.
	 *
	 * @param data - The details for constructing the FULL OUTER JOIN clause.
	 * @param data.targetTableName - The name of the target table to join with.
	 * @param [data.targetTableNameAs] - Optional alias for the target table.
	 * @param data.targetField - The field in the target table to join on.
	 * @param [data.initialTableName] - Optional name of the initial table, defaults to the main data source.
	 * @param data.initialField - The field in the initial table to join on.
	 *
	 * @returns
	 */
	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}): void {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`FULL OUTER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	/**
	 * Constructs and appends a WHERE clause to the current SQL query with AND/OR conditions.
	 *
	 * This method builds a WHERE clause based on the provided search parameters. It supports both AND and OR
	 * conditions and appends them to the existing WHERE clause in the query. The method also updates the list of values
	 * to be used in the SQL statement.
	 *
	 * @param data - The search parameters for constructing the WHERE clause.
	 * @param [data.params] - The primary search parameters, which are ANDed together.
	 * @param [data.paramsOr] - An array of search parameters, each set is ORed together.
	 *
	 * @returns
	 */
	where(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: ModelTypes.TSearchParams[];
	}): void {
		const { queryArray, queryOrArray, values } = Helpers.compareFields(
			data.params as ModelTypes.TSearchParams,
			data.paramsOr,
		);

		if (queryArray.length) {
			const comparedFields = queryArray.map((e: ModelTypes.TField) => {
				const operatorFunction = Helpers.operatorMappings.get(e.operator);

				if (operatorFunction) {
					return operatorFunction(e);
				} else {
					return `${e.key} ${e.operator} ?`;
				}
			}).join(" AND ");

			if (!this.#mainWhere) {
				this.#mainWhere += `WHERE (${comparedFields})`;
			} else {
				this.#mainWhere += ` AND (${comparedFields})`;
			}
		}

		if (queryOrArray?.length) {
			const comparedFieldsOr = [];

			for (const row of queryOrArray) {
				const { query } = row;
				const comparedFields = query.map((e: ModelTypes.TField) => {
					const operatorFunction = Helpers.operatorMappings.get(e.operator);

					if (operatorFunction) {
						return operatorFunction(e);
					} else {
						return `${e.key} ${e.operator} ?`;
					}
				}).join(" AND ");

				comparedFieldsOr.push(`(${comparedFields})`);
			}

			if (!this.#mainWhere) {
				this.#mainWhere += `WHERE (${comparedFieldsOr.join(" OR ")})`;
			} else {
				this.#mainWhere += ` AND (${comparedFieldsOr.join(" OR ")})`;
			}
		}

		this.#values.push(...values);
	}

	/**
	 * Adds a CTE (Common Table Expression) to the query with the specified name and query.
	 *
	 * This method constructs a `WITH` clause, allowing the inclusion of a CTE in the SQL query.
	 * The CTE is named and defined by the provided query. If there are existing CTEs, they are
	 * concatenated with commas.
	 *
	 * @param data - The CTE details.
	 * @param data.name - The name of the CTE.
	 * @param data.query - The SQL query that defines the CTE.
	 * @param [values] - Optional array of values to be substituted into the CTE query.
	 *
	 * @returns
	 */
	with(
		data: { name: string; query: string; },
		values?: unknown[],
	): void {
		const queryPrepared = values?.length
			? this.#processDataWithValues(data.query, values)
			: data.query;

		const text = `${data.name} AS (${queryPrepared})`;

		if (!this.#with) {
			this.#with = `WITH ${text}`;
		} else {
			this.#with += `, ${text}`;
		}
	}

	/**
	 * Appends a raw SQL WHERE clause to the current query with optional value substitution.
	 *
	 * This method adds a raw `WHERE` clause to the SQL query. If values are provided, they are
	 * substituted into the SQL string using the internal value processing method.
	 *
	 * @param data - The raw SQL WHERE clause to be appended.
	 * @param [values] - Optional array of values to be substituted into the SQL string.
	 *
	 * @returns
	 */
	rawWhere(
		data: string,
		values?: unknown[],
	): void {
		if (!data) return;

		if (!this.#mainWhere) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 5) !== "where") {
				this.#mainWhere = "WHERE";
			}
		}

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#mainWhere += ` ${dataPrepared}`;
	}

	/**
	 * Sets pagination for the query, specifying the limit and offset.
	 *
	 * This method adds a `LIMIT` and `OFFSET` clause to the query. It enforces that pagination
	 * can only be defined once per query.
	 *
	 * @param data - The pagination details.
	 * @param data.limit - The maximum number of records to return.
	 * @param data.offset - The number of records to skip before starting to return results.
	 *
	 * @returns
	 *
	 * @throws {Error} - Throws an error if pagination is already defined.
	 */
	pagination(data: {
		limit: number;
		offset: number;
	}): void {
		if (this.#pagination) throw new Error("pagination already defined");

		this.#pagination = "LIMIT ? OFFSET ?";

		this.#values.push(data.limit);
		this.#values.push(data.offset);
	}

	/**
	 * Adds an `ORDER BY` clause to the current query.
	 *
	 * This method specifies the columns and sorting direction for ordering the query results.
	 *
	 * @param data - Array of column and sorting direction objects.
	 * @param data.column - The column to sort by.
	 * @param data.sorting - The sorting direction, either "ASC" or "DESC".
	 *
	 * @returns
	 */
	orderBy(data: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]): void {
		if (!this.#orderBy) this.#orderBy = "ORDER BY";

		this.#orderBy += ` ${data.map((o) => `${o.column} ${o.sorting}`).join(", ")}`;
	}

	/**
	 * Adds a `GROUP BY` clause to the current query.
	 *
	 * This method specifies the columns for grouping query results.
	 *
	 * @param data - Array of columns to group by.
	 *
	 * @returns
	 */
	groupBy(data: string[]) {
		if (!this.#groupBy) this.#groupBy = "GROUP BY";

		this.#groupBy += ` ${data.join(", ")}`;
	}

	/**
	 * Constructs and appends a HAVING clause to the current SQL query with AND/OR conditions.
	 *
	 * This method builds a `HAVING` clause based on the provided search parameters. It supports
	 * both AND and OR conditions and appends them to the existing `HAVING` clause in the query.
	 * It also updates the list of values to be used in the SQL statement.
	 *
	 * @param data - The search parameters for constructing the HAVING clause.
	 * @param [data.params] - The primary search parameters, which are ANDed together.
	 * @param [data.paramsOr] - An array of search parameters, each set is ORed together.
	 *
	 * @returns
	 */
	having(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: ModelTypes.TSearchParams[];
	}): void {
		const { queryArray, queryOrArray, values } = Helpers.compareFields(
			data.params as ModelTypes.TSearchParams,
			data.paramsOr,
		);

		if (queryArray.length) {
			const comparedFields = queryArray.map((e: ModelTypes.TField) => {
				const operatorFunction = Helpers.operatorMappings.get(e.operator);

				if (operatorFunction) {
					return operatorFunction(e);
				} else {
					return `${e.key} ${e.operator} ?`;
				}
			}).join(" AND ");

			if (!this.#mainHaving) {
				this.#mainHaving += `HAVING (${comparedFields})`;
			} else {
				this.#mainHaving += ` AND (${comparedFields})`;
			}
		}

		if (queryOrArray?.length) {
			const comparedFieldsOr = [];

			for (const row of queryOrArray) {
				const { query } = row;
				const comparedFields = query.map((e: ModelTypes.TField) => {
					const operatorFunction = Helpers.operatorMappings.get(e.operator);

					if (operatorFunction) {
						return operatorFunction(e);
					} else {
						return `${e.key} ${e.operator} ?`;
					}
				}).join(" AND ");

				comparedFieldsOr.push(`(${comparedFields})`);
			}

			if (!this.#mainHaving) {
				this.#mainHaving += `HAVING (${comparedFieldsOr.join(" OR ")})`;
			} else {
				this.#mainHaving += ` AND (${comparedFieldsOr.join(" OR ")})`;
			}
		}

		this.#values.push(...values);
	}

	/**
	 * Appends a raw SQL HAVING clause to the current query with optional value substitution.
	 *
	 * This method allows adding a raw `HAVING` clause to the SQL query. If values are provided,
	 * they are substituted into the SQL string using the internal value processing method.
	 *
	 * @param data - The raw SQL HAVING clause to be appended.
	 * @param [values] - Optional array of values to be substituted into the SQL string.
	 *
	 * @returns
	 */
	rawHaving(
		data: string,
		values?: unknown[],
	): void {
		if (!data) return;

		if (!this.#mainHaving) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 6) !== "having") {
				this.#mainHaving = "HAVING";
			}
		}

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#mainHaving += ` ${dataPrepared}`;
	}

	/**
	 * Marks the query as a subquery and optionally assigns a name to the subquery.
	 *
	 * This method configures the query to be treated as a subquery, and optionally assigns a name to it.
	 *
	 * @param [data] - Optional name for the subquery.
	 *
	 * @returns
	 */
	toSubquery(data?: string): void {
		this.isSubquery = true;

		if (data) {
			this.#subqueryName = data;
		}
	}
}
