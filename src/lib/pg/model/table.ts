import pg from "pg";

import * as Helpers from "../helpers/index.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import queries from "./queries.js";
import { setLoggerAndExecutor } from "../helpers/index.js";

/**
 * Represents a base table with common database operations.
 */
export class BaseTable<const T extends readonly string[] = readonly string[]> {
	#insertOptions;
	#sortingOrders = new Set(["ASC", "DESC"]);
	#tableFieldsSet;
	#isLoggerEnabled: boolean | undefined;
	#logger?: SharedTypes.TLogger;
	#executeSql;

	#initialArgs;

	createField;
	pool: pg.Pool | pg.PoolClient | pg.Client;
	primaryKey;
	tableName;
	tableFields: readonly string[];
	updateField;

	/**
	 * Creates an instance of BaseTable.
	 *
	 * Initializes a new instance of the `BaseTable` class with the provided table configuration and database credentials.
	 * Optionally, additional database options can be specified.
	 *
	 * @param data - The configuration object for the table, which includes:
	 *   - `additionalSortingFields`: An optional array of fields to use for additional sorting.
	 *   - `createField`: An optional object specifying a field to set with a timestamp when a record is created.
	 *     - `title`: The field name.
	 *     - `type`: The type of timestamp (`"unix_timestamp"` or `"timestamp"`).
	 *   - `primaryKey`: The primary key field or fields for the table. This can be a single field or an array of fields.
	 *   - `tableFields`: The fields in the table.
	 *   - `tableName`: The name of the table.
	 *   - `updateField`: An optional object specifying a field to update with a timestamp when a record is updated.
	 *     - `title`: The field name.
	 *     - `type`: The type of timestamp (`"unix_timestamp"` or `"timestamp"`).
	 * @param dbCreds - The credentials for connecting to the database, including:
	 *   - `database`: The name of the database.
	 *   - `host`: The database host.
	 *   - `password`: The password for connecting to the database.
	 *   - `port`: The port number for connecting to the database.
	 *   - `user`: The username for connecting to the database.
	 * @param [options] - Optional configuration options for the database connection, which can include:
	 *   - `insertOptions`: Configuration for insert operations.
	 *     - `onConflict`: Specifies the action to take when there is a conflict on insert.
	 *   - `poolClient`: An optional `pg.PoolClient` for managing database connections.
	 */
	constructor(
		data: Types.TTable<T>,
		dbCreds: Types.TDBCreds,
		options?: Types.TDBOptions,
	) {
		const { client, insertOptions, isLoggerEnabled, logger } = options || {};

		this.createField = data.createField;
		this.pool = client || connection.getStandardPool(dbCreds);
		this.primaryKey = data.primaryKey;
		this.tableName = data.tableName;
		this.tableFields = [...data.tableFields];
		this.updateField = data.updateField;

		this.#tableFieldsSet = new Set([
			...this.tableFields,
			...(data.additionalSortingFields || []),
		] as const);

		this.#initialArgs = { data, dbCreds, options };

		const preparedOptions = setLoggerAndExecutor(
			this.pool,
			{ isLoggerEnabled, logger },
		);

		this.#insertOptions = insertOptions;
		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	set isLoggerEnabled(value: boolean) {
		const prev = this.#isLoggerEnabled;

		if (prev === value) {
			return;
		}

		const preparedOptions = setLoggerAndExecutor(
			this.pool,
			{ isLoggerEnabled: value, logger: this.#logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	get isLoggerEnabled(): boolean | undefined {
		return this.#isLoggerEnabled;
	}

	get executeSql() {
		return this.#executeSql;
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
	setClientInCurrentClass(client: pg.Pool | pg.PoolClient | pg.Client): this {
		return new (this.constructor as new (
			data: Types.TTable<T>,
			dbCreds: Types.TDBCreds,
			options?: Types.TDBOptions,
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
	setClientInBaseClass(client: pg.Pool | pg.PoolClient | pg.Client): BaseTable<T> {
		return new BaseTable(
			{ ...this.#initialArgs.data },
			{ ...this.#initialArgs.dbCreds },
			{ ...this.#initialArgs.options, client },
		);
	}

	compareFields = Helpers.compareFields;
	getFieldsToSearch = Helpers.getFieldsToSearch;

	compareQuery = {
		createMany: (
			recordParams: SharedTypes.TRawParams[],
			saveOptions?: { returningFields?: string[]; },
		): { query: string; values: unknown[]; } => {
			const v = [];
			const k = [];
			const headers = new Set<string>();

			const [example] = recordParams;

			if (!example) throw new Error("Invalid recordParams");

			const params = SharedHelpers.clearUndefinedFields(example);

			Object.keys(params).forEach((e) => headers.add(e));

			if (this.createField) {
				headers.add(this.createField.title);
			}

			for (const pR of recordParams) {
				const params = SharedHelpers.clearUndefinedFields(pR);
				const keys = new Set(Object.keys(params));
				const paramsPrepared = [...Object.values(params)];

				if (this.createField) {
					if (!keys.has(this.createField.title)) {
						keys.add(this.createField.title);

						switch (this.createField.type) {
							case "timestamp":
								paramsPrepared.push(new Date().toISOString());
								break;

							case "unix_timestamp":
								paramsPrepared.push(Date.now());
								break;

							default:
								throw new Error("Invalid type: " + this.createField.type);
						}
					}
				}

				k.push([...keys]);
				v.push(...paramsPrepared);

				if (!k.length) {
					throw new Error(`Invalid params, all fields are undefined - ${Object.keys(recordParams).join(", ")}`);
				}

				for (const key of keys) {
					if (!headers.has(key)) {
						throw new Error(`Invalid params, all fields are undefined - ${Object.keys(pR).join(", ")}`);
					}
				}
			}

			const onConflict = this.#insertOptions?.onConflict || "";

			return {
				query: queries.createMany({
					fields: k,
					headers: [...headers],
					onConflict,
					returning: saveOptions?.returningFields,
					tableName: this.tableName,
				}),
				values: v,
			};
		},
		createOne: (
			recordParams = {},
			saveOptions?: { returningFields?: string[]; },
		): { query: string; values: unknown[]; } => {
			const clearedParams = SharedHelpers.clearUndefinedFields(recordParams);
			const fields = Object.keys(clearedParams);
			const onConflict = this.#insertOptions?.onConflict || "";

			if (!fields.length) { throw new Error("No one save field arrived"); }

			return {
				query: queries.createOne(this.tableName, fields, this.createField, onConflict, saveOptions?.returningFields),
				values: Object.values(clearedParams),
			};
		},
		deleteAll: (): { query: string; } => {
			return { query: queries.deleteAll(this.tableName) };
		},
		deleteByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			return {
				query: queries.deleteByParams(this.tableName, searchFields),
				values,
			};
		},
		deleteOneByPk: <T>(primaryKey: T): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			return {
				query: queries.deleteByPk(this.tableName, this.primaryKey),
				values: Array.isArray(primaryKey) ? primaryKey : [primaryKey],
			};
		},
		getArrByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected = ["*"],
			pagination?: SharedTypes.TPagination,
			order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
		): { query: string; values: unknown[]; } => {
			if (order?.length) {
				for (const o of order) {
					if (!this.#tableFieldsSet.has(o.orderBy)) {
						const allowedFields = Array.from(this.#tableFieldsSet).join(", ");

						throw new Error(`Invalid orderBy: ${o.orderBy}. Allowed fields are: ${allowedFields}`);
					}

					if (!this.#sortingOrders.has(o.ordering)) { throw new Error("Invalid ordering"); }
				}
			}

			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, pagination, order);

			return {
				query: queries.getByParams(this.tableName, selectedFields, searchFields, orderByFields, paginationFields),
				values,
			};
		},
		getCountByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			return {
				query: queries.getCountByParams(this.tableName, searchFields),
				values,
			};
		},
		getCountByPks: <T>(pks: T[]): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			if (Array.isArray(pks[0])) {
				if (!Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

				return {
					query: queries.getCountByCompositePks(this.primaryKey as string[], this.tableName, pks.length),
					values: pks.flat(),
				};
			}

			if (Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

			return {
				query: queries.getCountByPks(this.primaryKey as string, this.tableName),
				values: [pks],
			};
		},
		getCountByPksAndParams: <T>(
			pks: T[],
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderNumber, searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			if (Array.isArray(pks[0])) {
				if (!Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

				return {
					query: queries.getCountByCompositePksAndParams(this.primaryKey, this.tableName, searchFields, orderNumber, pks.length),
					values: [...values, ...pks.flat()],
				};
			}

			if (Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

			return {
				query: queries.getCountByPksAndParams(this.primaryKey, this.tableName, searchFields, orderNumber),
				values: [...values, pks],
			};
		},
		getOneByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected = ["*"],
		): { query: string; values: unknown[]; } => {
			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, { limit: 1, offset: 0 });

			return {
				query: queries.getByParams(
					this.tableName,
					selectedFields,
					searchFields,
					orderByFields,
					paginationFields,
				),
				values,
			};
		},
		getOneByPk: <T>(primaryKey: T): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			return {
				query: queries.getOneByPk(this.tableName, this.primaryKey),
				values: Array.isArray(primaryKey) ? [...primaryKey] : [primaryKey],
			};
		},
		updateByParams: (
			queryConditions: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; returningFields?: string[]; },
			updateFields: SharedTypes.TRawParams = {},
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields(queryConditions.$and, queryConditions.$or);
			const { orderNumber, searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });
			const clearedUpdate = SharedHelpers.clearUndefinedFields(updateFields);
			const fieldsToUpdate = Object.keys(clearedUpdate);

			if (!queryArray.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByParams(this.tableName, fieldsToUpdate, searchFields, this.updateField, orderNumber + 1, queryConditions?.returningFields),
				values: [...values, ...Object.values(clearedUpdate)],
			};
		},
		updateOneByPk: <T>(
			primaryKeyValue: T,
			updateFields: SharedTypes.TRawParams = {},
			updateOptions?: { returningFields?: string[]; },
		): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			const clearedParams = SharedHelpers.clearUndefinedFields(updateFields);
			const fields = Object.keys(clearedParams);

			if (!fields.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByPk(this.tableName, fields, this.primaryKey, this.updateField, updateOptions?.returningFields),
				values: [...Object.values(clearedParams), ...Array.isArray(primaryKeyValue) ? [...primaryKeyValue] : [primaryKeyValue]],
			};
		},
	};

	/**
	 * Deletes all records from the table.
	 *
	 * This method executes a `DELETE` SQL statement to remove all records from the table, leaving it empty.
	 * It does not return any data or status, only ensures that the operation has been completed.
	 *
	 * @returns A promise that resolves when the delete operation has been successfully completed.
	 */
	async deleteAll(): Promise<void> {
		const sql = this.compareQuery.deleteAll();

		await this.#executeSql(sql);

		return;
	}

	/**
	 * Deletes a single record from the database based on the provided primary key.
	 *
	 * @param primaryKey - The value of the primary key of the record to be deleted. The type of the primary key depends on the table schema and could be a string, number, or any other type.
	 *
	 * @returns A promise that resolves to the primary key of the deleted record if found, or `null` if no record with the given primary key was found.
	 */
	async deleteOneByPk<T>(primaryKey: T): Promise<T | null> {
		const sql = this.compareQuery.deleteOneByPk(primaryKey);

		const { rows: [entity] } = await this.#executeSql(sql);

		if (!entity) return null;

		if (Array.isArray(this.primaryKey)) {
			return this.primaryKey.map((e) => entity[e]) as T;
		} else {
			return entity[this.primaryKey as string];
		}
	}

	/**
	 * Deletes records from the database based on the specified search parameters.
	 *
	 * @param params - The search parameters to identify which records to delete.
	 * @param params.$and - The conditions that must be met for a record to be deleted. This is an array of conditions that are combined with logical AND.
	 * @param [params.$or] - Optional. An array of additional conditions combined with logical OR. If provided, records that match any of these conditions will also be deleted.
	 *
	 * @returns A promise that resolves to `null` once the delete operation is complete.
	 */
	async deleteByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	): Promise<null> {
		const sql = this.compareQuery.deleteByParams(params);

		await this.#executeSql(sql);

		return null;
	}

	/**
	 * Drops the table from the database, with optional additional behaviors.
	 *
	 * @param [options={}] - Options to customize the drop operation.
	 * @param [options.cascade=false] - If true, drops tables that have foreign key references to this table.
	 * @param [options.ifExists=false] - If true, does not raise an error if the table does not exist.
	 * @param [options.restrict=false] - If true, prevents dropping the table if there are any foreign key references.
	 *
	 * @returns A promise that resolves when the drop operation is complete.
	 */
	async dropTable(options: {
		cascade?: boolean;
		ifExists?: boolean;
		restrict?: boolean;
	} = {}): Promise<void> {
		const {
			cascade = false,
			ifExists = false,
			restrict = false,
		} = options;
		const behaviorOption = cascade ? "CASCADE" : restrict ? "RESTRICT" : "";
		const query = `DROP TABLE ${ifExists ? "IF EXISTS " : ""}${this.tableName} ${behaviorOption};`;

		await this.#executeSql({ query });
	}

	/**
	 * Truncates the table, removing all records and optionally applying additional options.
	 *
	 * @param [options={}] - Options to customize the truncate operation.
	 * @param [options.cascade=false] - If true, truncates tables that have foreign key references to this table.
	 * @param [options.continueIdentity=false] - If true, does not reset the sequence for identity columns.
	 * @param [options.only=false] - If true, only truncates the specified table and not its partitions.
	 * @param [options.restrict=false] - If true, prevents truncating if there are any foreign key references.
	 * @param [options.restartIdentity=false] - If true, resets the sequence for identity columns.
	 *
	 * @returns A promise that resolves when the truncate operation is complete.
	 */
	async truncateTable(options: {
		cascade?: boolean;
		continueIdentity?: boolean;
		only?: boolean;
		restrict?: boolean;
		restartIdentity?: boolean;
	} = {}): Promise<void> {
		const {
			cascade = false,
			continueIdentity = false,
			only = false,
			restartIdentity = false,
			restrict = false,
		} = options;
		const identityOption = restartIdentity ? "RESTART IDENTITY" : continueIdentity ? "CONTINUE IDENTITY" : "";
		const behaviorOption = cascade ? "CASCADE" : restrict ? "RESTRICT" : "";
		const truncateOptions = [identityOption, behaviorOption].filter(Boolean).join(" ");

		const query = `TRUNCATE ${only ? "ONLY " : ""}${this.tableName} ${truncateOptions};`;

		await this.#executeSql({ query });
	}

	/**
	 * Retrieves an array of records from the database based on the provided search parameters.
	 *
	 * @param params - The search parameters used to filter records.
	 * @param params.$and - The conditions that must be met for a record to be included in the results.
	 * @param [params.$or] - Optional array of conditions where at least one must be met for a record to be included in the results.
	 * @param [selected=["*"]] - Optional array of fields to select from the records. If not specified, all fields are selected.
	 * @param [pagination] - Optional pagination options to limit and offset the results.
	 * @param [order] - Optional array of order options for sorting the results.
	 * @param order[].orderBy - The field by which to sort the results.
	 * @param order[].ordering - The sorting direction ("ASC" for ascending or "DESC" for descending).
	 *
	 * @returns A promise that resolves to an array of records matching the search parameters.
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
	 * Retrieves the count of records from the database based on the provided primary key values.
	 *
	 * @param pks - An array of primary key values for which to count the records.
	 *
	 * @returns A promise that resolves to the count of records with the specified primary keys.
	 */
	async getCountByPks<T>(pks: T[]): Promise<number> {
		const sql = this.compareQuery.getCountByPks(pks);
		const { rows: [entity] } = await this.#executeSql(sql);

		return Number(entity?.count) || 0;
	}

	/**
	 * Retrieves the count of records from the database based on the provided primary key values and search parameters.
	 *
	 * @param pks - An array of primary key values to filter the records.
	 * @param params - The search parameters to further filter the records.
	 * @param params.$and - The conditions that must be met for a record to be counted.
	 * @param [params.$or] - Optional array of conditions where at least one must be met for a record to be counted.
	 *
	 * @returns A promise that resolves to the count of records matching the primary keys and search parameters.
	 */
	async getCountByPksAndParams<T>(
		pks: T[],
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	): Promise<number> {
		const sql = this.compareQuery.getCountByPksAndParams(pks, params);
		const { rows: [entity] } = await this.#executeSql(sql);

		return Number(entity?.count) || 0;
	}

	/**
	 * Retrieves the count of records from the database based on the provided search parameters.
	 *
	 * @param params - The search parameters to filter the records.
	 * @param params.$and - The conditions that must be met for a record to be counted.
	 * @param [params.$or] - Optional array of conditions where at least one must be met for a record to be counted.
	 *
	 * @returns A promise that resolves to the count of records matching the search parameters.
	 */
	async getCountByParams(params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; }): Promise<number> {
		const sql = this.compareQuery.getCountByParams(params);
		const { rows: [entity] } = await this.#executeSql(sql);

		return Number(entity?.count) || 0;
	}

	/**
	 * Retrieves a single record from the database based on search parameters.
	 *
	 * @param params - The search parameters to filter the records.
	 * @param params.$and - The search conditions that must be met.
	 * @param [params.$or] - Optional array of search conditions where at least one must be met.
	 * @param[selected=["*"]] - The fields to select in the result. Defaults to selecting all fields.
	 *
	 * @returns A promise that resolves to the retrieved record or undefined if no record is found.
	 */
	async getOneByParams<T extends pg.QueryResultRow>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected: string[] = ["*"],
	): Promise<T | undefined> {
		const sql = this.compareQuery.getOneByParams(params, selected);
		const { rows: [entity] } = await this.#executeSql<T>(sql);

		return entity;
	}

	/**
	 * Retrieves a single record from the database based on the primary key.
	 *
	 * @param primaryKey - The value of the primary key to identify the record.
	 *
	 * @returns A promise that resolves to the retrieved record or undefined if no record is found.
	 */
	async getOneByPk<T, R extends pg.QueryResultRow>(primaryKey: T): Promise<R | undefined> {
		const sql = this.compareQuery.getOneByPk(primaryKey);
		const { rows: [entity] } = await this.#executeSql<R>(sql);

		return entity;
	}

	/**
	 * Creates a single record in the database.
	 *
	 * @param [recordParams={}] - The parameters for the record to be created.
	 * @param [saveOptions] - The options for saving the record.
	 * @param [saveOptions.returningFields] - An array of field names to return after the record is created.
	 *
	 * @returns A promise that resolves to the created record or undefined if no record was created.
	 */
	async createOne<T extends pg.QueryResultRow>(
		recordParams: SharedTypes.TRawParams = {},
		saveOptions?: { returningFields?: string[]; },
	): Promise<T | undefined> {
		const sql = this.compareQuery.createOne(recordParams, saveOptions);
		const { rows: [entity] } = await this.#executeSql<T>(sql);

		return entity;
	}

	/**
	 * Creates multiple records in the database.
	 *
	 * @param recordParams - An array of record parameters to insert.
	 * @param [saveOptions] - The options for saving records.
	 * @param [saveOptions.returningFields] - An array of field names to return after the records are created.
	 *
	 * @returns A promise that resolves to an array of created records.
	 */
	async createMany<T extends pg.QueryResultRow>(
		recordParams: SharedTypes.TRawParams[],
		saveOptions?: { returningFields?: string[]; },
	): Promise<T[]> {
		const sql = this.compareQuery.createMany(recordParams, saveOptions);
		const { rows: entities } = await this.#executeSql<T>(sql);

		return entities;
	}

	/**
	 * Updates records based on search parameters.
	 *
	 * @param queryConditions - The query conditions for identifying records to update.
	 * @param queryConditions.$and - The mandatory conditions for the update.
	 * @param [queryConditions.$or] - The optional conditions for the update.
	 * @param [queryConditions.returningFields] - The fields to return after the update.
	 * @param [updateFields={}] - An object containing the fields to update.
	 *
	 * @returns A promise that resolves to the rows affected by the update.
	 */
	async updateByParams(
		queryConditions: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; returningFields?: string[]; },
		updateFields: SharedTypes.TRawParams = {},
	): Promise<pg.QueryResultRow[]> {
		const sql = this.compareQuery.updateByParams(queryConditions, updateFields);
		const { rows } = await this.#executeSql(sql);

		return rows;
	}

	/**
	 * Updates one record by primary key.
	 *
	 * @param primaryKeyValue - The value of the primary key to identify the record to be updated.
	 * @param [updateFields={}] - An object containing the fields to update.
	 * @param [updateOptions] - Options for the update operation.
	 * @param [updateOptions.returningFields] - An array of fields to return after the update.
	 *
	 * @returns A promise that resolves to the query result.
	 */
	async updateOneByPk<Q extends pg.QueryResultRow, T>(
		primaryKeyValue: T,
		updateFields: SharedTypes.TRawParams = {},
		updateOptions?: { returningFields?: string[]; },
	): Promise<Q | undefined> {
		const sql = this.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions);
		const { rows: [entity] } = await this.#executeSql<Q>(sql);

		return entity;
	}

	/**
	 * Creates a query builder instance.
	 *
	 * @param [options] - The options for the query builder.
	 * @param [options.client] - The database client.
	 * @param [options.tableName] - The table name.
	 *
	 * @returns A new query builder instance.
	 */
	queryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient | pg.Client;
		tableName?: string;
	}): QueryBuilder {
		const { client, tableName } = options || {};

		return new QueryBuilder(
			tableName ?? this.tableName,
			client ?? this.pool,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);
	}

	// STATIC METHODS

	/**
	 * Gets a standard pool for database connections.
	 *
	 * @param creds - The database credentials.
	 * @param [poolName] - The name of the pool.
	 *
	 * @returns The database connection pool.
	 */
	static getStandardPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return connection.getStandardPool(creds, poolName);
	}

	/**
	 * Removes a standard pool for database connections.
	 *
	 * @param creds - The database credentials.
	 * @param [poolName] - The name of the pool.
	 *
	 * @returns
	 */
	static async removeStandardPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeStandardPool(creds, poolName);
	}

	/**
	 * Gets a transaction pool for database connections.
	 *
	 * @param creds - The database credentials.
	 * @param [poolName] - The name of the pool.
	 *
	 * @returns The transaction connection pool.
	 */
	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return connection.getTransactionPool(creds, poolName);
	}

	/**
	 * Removes a transaction pool for database connections.
	 *
	 * @param creds - The database credentials.
	 * @param [poolName] - The name of the pool.
	 *
	 * @returns
	 */
	static async removeTransactionPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeTransactionPool(creds, poolName);
	}

	/**
	 * Generates an SQL insert query and its corresponding values array based on the provided data.
	 *
	 * @param data - The data for generating the insert query.
	 * @param data.params - The parameters for the insert query. Can be a single object or an array of objects.
	 * @param [data.returning] - The fields to return after the insert operation.
	 * @param data.tableName - The name of the table to insert into.
	 *
	 * @returns An object containing the SQL insert query and its values.
	 */
	static getInsertFields<
		P extends SharedTypes.TRawParams = SharedTypes.TRawParams,
		F extends string = string
	>(data: {
		params: P | P[];
		returning?: F[];
		tableName: string;
	}): { query: string; values: unknown[]; } {
		const {
			params: paramsRaw,
			returning,
			tableName,
		} = data;

		if (Array.isArray(paramsRaw)) {
			const v = [];
			const k = [];
			const headers = new Set();

			const [example] = paramsRaw;

			if (!example) throw new Error("Invalid parameters");

			const params = SharedHelpers.clearUndefinedFields(example);

			Object.keys(params).forEach((e) => headers.add(e));

			for (const pR of paramsRaw) {
				const params = SharedHelpers.clearUndefinedFields(pR);
				const keys = Object.keys(params);

				k.push(keys);
				v.push(...Object.values(params));

				if (!k.length) {
					throw new Error(`Invalid params, all fields are undefined - ${Object.keys(paramsRaw).join(", ")}`);
				}

				for (const key of keys) {
					if (!headers.has(key)) {
						throw new Error(`Invalid params, all fields are undefined - ${Object.keys(pR).join(", ")}`);
					}
				}
			}

			const returningSQL = returning?.length
				? `RETURNING ${returning.join(",")}`
				: "";

			let idx = 0;

			const query = `
				INSERT INTO ${tableName}(${Array.from(headers).join(",")})
				VALUES(${k.map((e) => e.map(() => "$" + ++idx)).join("),(")})
				${returningSQL}
			`;

			return { query, values: v };
		}

		const params = SharedHelpers.clearUndefinedFields(paramsRaw);
		const k = Object.keys(params);
		const v = Object.values(params);

		if (!k.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(paramsRaw).join(", ")}`);

		const returningSQL = returning?.length
			? `RETURNING ${returning.join(",")}`
			: "";

		const query = `INSERT INTO ${tableName}(${k.join(",")}) VALUES(${k.map((_, idx) => "$" + ++idx).join(",")}) ${returningSQL};`;

		return { query, values: v };
	}

	/**
	 * Generates an SQL update query and its corresponding values array based on the provided data.
	 *
	 * @param data - The data for generating the update query.
	 * @param data.params - The parameters for the update query.
	 * @param data.primaryKey - The primary key field and its value.
	 * @param data.primaryKey.field - The primary key field name.
	 * @param data.primaryKey.value - The primary key value.
	 * @param [data.returning] - The fields to return after the update.
	 * @param data.tableName - The name of the table to update.
	 * @param [data.updateField] - The field to update with a timestamp.
	 * @param data.updateField.title - The field name to update.
	 * @param data.updateField.type - The type of the timestamp.
	 *
	 * @returns An object containing the SQL update query and its values.
	 */
	static getUpdateFields<
		P extends SharedTypes.TRawParams = SharedTypes.TRawParams,
		F extends string = string
	>(data: {
		params: P;
		primaryKey: { field: F; value: string | number; };
		returning?: F[];
		tableName: string;
		updateField?: { title: F; type: "unix_timestamp" | "timestamp"; } | null;
	}): { query: string; values: unknown[]; } {
		const {
			params: paramsRaw,
			primaryKey,
			returning,
			tableName,
			updateField,
		} = data;

		const params = SharedHelpers.clearUndefinedFields(paramsRaw);
		const k = Object.keys(params);
		const v = Object.values(params);

		if (!k.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(paramsRaw).join(", ")}`);

		let updateFields = k.map((e: string, idx: number) => `${e} = $${idx + 2}`).join(",");

		if (updateField) {
			switch (updateField.type) {
				case "timestamp": {
					updateFields += `, ${updateField.title} = NOW()`;
					break;
				}
				case "unix_timestamp": {
					updateFields += `, ${updateField.title} = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))`;
					break;
				}

				default: {
					throw new Error("Invalid type: " + updateField.type);
				}
			}
		}

		const returningSQL = returning?.length
			? `RETURNING ${returning.join(",")}`
			: "";

		const query = `UPDATE ${tableName} SET ${updateFields} WHERE ${primaryKey.field} = $1 ${returningSQL};`;

		return { query, values: [primaryKey.value, ...v] };
	}
}
