import mysql from "mysql2/promise";

import * as Helpers from "../helpers/index.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import queries, { generateTimestampQuery } from "./queries.js";
import { QueryBuilder } from "../query-builder/index.js";
import { setLoggerAndExecutor } from "../helpers/index.js";

export class BaseModel<const T extends readonly string[] = readonly string[]> {
	#insertOptions;
	#sortingOrders = new Set(["ASC", "DESC"]);
	#tableFieldsSet;
	#isLoggerEnabled: boolean | undefined;
	#logger?: SharedTypes.TLogger;
	#executeSql;

	/**
	 * The MySQL executor.
	 * - mysql.Pool
	 * - mysql.PoolClient
	 * - mysql.Client
	 */
	#executor: Types.TExecutor;

	createField;
	isPKAutoIncremented;
	primaryKey;
	tableName;
	tableFields: readonly string[];
	updateField;

	constructor(
		data: Types.TTable<T>,
		dbCreds: Types.TDBCreds,
		options?: Types.TDBOptions,
	) {
		this.createField = data.createField;
		this.#executor = connection.getStandardPool(dbCreds);
		this.primaryKey = data.primaryKey;
		this.isPKAutoIncremented = typeof data.isPKAutoIncremented === "boolean"
			? data.isPKAutoIncremented
			: true;
		this.tableName = data.tableName;
		this.tableFields = [...data.tableFields];
		this.updateField = data.updateField;

		this.#tableFieldsSet = new Set([
			...this.tableFields,
			...(data.additionalSortingFields || []),
		] as const);

		const { insertOptions, isLoggerEnabled, logger } = options || {};

		const preparedOptions = setLoggerAndExecutor(
			this.#executor,
			{ isLoggerEnabled, logger },
		);

		this.#insertOptions = insertOptions;
		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Gets the database client for the model.
	 *
	 * @returns The database client for the model.
	 */
	get pool() {
		return this.#executor;
	}

	/**
	 * Gets the MySQL executor for the model.
	 *
	 * @returns The MySQL executor for the model.
	 */
	get executor() {
		return this.#executor;
	}

	/**
	 * Sets the logger for the model.
	 *
	 * @param logger - The logger to use for the model.
	 */
	setLogger(logger: SharedTypes.TLogger) {
		const preparedOptions = setLoggerAndExecutor(
			this.#executor,
			{ isLoggerEnabled: true, logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Sets the executor for the model.
	 *
	 * @param executor - The executor to use for the model.
	 */
	setExecutor(executor: Types.TExecutor) {
		const preparedOptions = setLoggerAndExecutor(
			executor,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);

		this.#executeSql = preparedOptions.executeSql;
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

	compareFields = Helpers.compareFields;
	getFieldsToSearch = Helpers.getFieldsToSearch;

	compareQuery = {
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
					values: [pks.flat()],
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
			const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			if (Array.isArray(pks[0])) {
				if (!Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

				return {
					query: queries.getCountByCompositePksAndParams(this.primaryKey, this.tableName, searchFields, pks.length),
					values: pks.flat(),
				};
			}

			if (Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

			return {
				query: queries.getCountByPksAndParams(this.primaryKey, this.tableName, searchFields),
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
		getOneByPk: <T>(pk: T): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			return {
				query: queries.getOneByPk(this.tableName, this.primaryKey),
				values: [pk],
			};
		},
		save: (
			recordParams = {},
		): { query: string; values: unknown[]; } => {
			const clearedParams = SharedHelpers.clearUndefinedFields(recordParams);
			const fields = Object.keys(clearedParams);
			const onConflict = this.#insertOptions?.onConflict || "";

			if (!fields.length) { throw new Error("No one save field arrived"); }

			return {
				query: queries.createOne(this.tableName, fields, this.createField, onConflict),
				values: Object.values(clearedParams),
			};
		},
		updateByParams: (
			queryConditions: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			updateFields: SharedTypes.TRawParams = {},
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields(queryConditions.$and, queryConditions.$or);
			const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });
			const clearedUpdate = SharedHelpers.clearUndefinedFields(updateFields);
			const fieldsToUpdate = Object.keys(clearedUpdate);

			if (!queryArray.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByParams(this.tableName, fieldsToUpdate, searchFields, this.updateField),
				values: [...Object.values(clearedUpdate), ...values],
			};
		},
		updateOneByPk: <T>(
			primaryKeyValue: T,
			updateFields: SharedTypes.TRawParams = {},
		): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			const clearedParams = SharedHelpers.clearUndefinedFields(updateFields);
			const fields = Object.keys(clearedParams);

			if (!fields.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByPk(this.tableName, fields, this.primaryKey, this.updateField),
				values: [...Object.values(clearedParams), primaryKeyValue],
			};
		},
	};

	async deleteAll(): Promise<void> {
		const sql = this.compareQuery.deleteAll();

		await this.#executeSql(sql);

		return;
	}

	async deleteOneByPk<T>(primaryKey: T): Promise<void> {
		const sql = this.compareQuery.deleteOneByPk(primaryKey);

		await this.#executeSql(sql);

		return;
	}

	async deleteByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	): Promise<void> {
		const sql = this.compareQuery.deleteByParams(params);

		await this.#executeSql(sql);

		return;
	}

	async getArrByParams<T>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	): Promise<T[]> {
		const sql = this.compareQuery.getArrByParams(params, selected, pagination, order);
		const [rows] = await this.#executeSql <T & mysql.RowDataPacket>(sql);

		return rows as T[];
	}

	async getCountByPks<T>(pks: T[]): Promise<number> {
		const sql = this.compareQuery.getCountByPks(pks);
		const [[entity]] = await this.#executeSql<{ count: number; } & mysql.RowDataPacket>(sql);

		return Number(entity?.count) || 0;
	}

	async getCountByPksAndParams<T>(
		pks: T[],
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	): Promise<number> {
		const sql = this.compareQuery.getCountByPksAndParams(pks, params);
		const [[entity]] = await this.#executeSql<{ count: number; } & mysql.RowDataPacket>(sql);

		return Number(entity?.count) || 0;
	}

	async getCountByParams(params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; }): Promise<number> {
		const sql = this.compareQuery.getCountByParams(params);
		const [[entity]] = await this.#executeSql<{ count: number; } & mysql.RowDataPacket>(sql);

		return Number(entity?.count) || 0;
	}

	async getOneByParams<T>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
	): Promise<T | undefined> {
		const sql = this.compareQuery.getOneByParams(params, selected);
		const [[entity]] = await this.#executeSql <T & mysql.RowDataPacket>(sql);

		return entity as T;
	}

	async getOneByPk<T, R>(pk: T): Promise<R | undefined> {
		const sql = this.compareQuery.getOneByPk(pk);
		const [[entity]] = await this.#executeSql<R & mysql.RowDataPacket>(sql);

		return entity as R | undefined;
	}

	async save(
		recordParams = {},
	): Promise<number> {
		const sql = this.compareQuery.save(recordParams);

		const [rows] = await this.#executeSql<mysql.ResultSetHeader>(sql);

		if (!this.isPKAutoIncremented) {
			return -1;
		}

		return rows.insertId;
	}

	async updateByParams(
		queryConditions: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		updateFields: SharedTypes.TRawParams = {},
	): Promise<void> {
		const sql = this.compareQuery.updateByParams(queryConditions, updateFields);

		await this.#executeSql(sql);

		return;
	}

	async updateOneByPk<T>(
		primaryKeyValue: T,
		updateFields: SharedTypes.TRawParams = {},
	): Promise<void> {
		const sql = this.compareQuery.updateOneByPk(primaryKeyValue, updateFields);

		await this.#executeSql(sql);

		return;
	}

	/**
	 * @experimental
	 */
	queryBuilder(options?: {
		client?: Types.TExecutor;
		tableName?: string;
	}) {
		const { client, tableName } = options || {};

		return new QueryBuilder(
			tableName ?? this.tableName,
			client ?? this.#executor,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);
	}

	// STATIC METHODS
	static getStandardPool(creds: Types.TDBCreds, poolName?: string): mysql.Pool {
		return connection.getStandardPool(creds, poolName);
	}

	static async removeStandardPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeStandardPool(creds, poolName);
	}

	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): mysql.Pool {
		return connection.getTransactionPool(creds, poolName);
	}

	static async removeTransactionPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeTransactionPool(creds, poolName);
	}

	static getInsertFields<
		P extends SharedTypes.TRawParams = SharedTypes.TRawParams,
	>(data: {
		params: P | P[];
		tableName: string;
	}): { query: string; values: unknown[]; } {
		const {
			params: paramsRaw,
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

			const query = `INSERT INTO ${tableName}(${Array.from(headers).join(",")}) VALUES(${k.map((e) => e.map(() => "?")).join("),(")});`;

			return { query, values: v };
		}

		const params = SharedHelpers.clearUndefinedFields(paramsRaw);
		const k = Object.keys(params);
		const v = Object.values(params);

		if (!k.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(paramsRaw).join(", ")}`);

		const query = `INSERT INTO ${tableName}(${k.join(",")}) VALUES(${k.map(() => "?").join(",")});`;

		return { query, values: v };
	}

	static getUpdateFields<
		P extends SharedTypes.TRawParams = SharedTypes.TRawParams,
		F extends string = string
	>(data: {
		params: P;
		primaryKey: { field: F; value: string | number; };
		tableName: string;
		updateField?: { title: F; type: "unix_timestamp" | "timestamp"; } | null;
	}): { query: string; values: unknown[]; } {
		const {
			params: paramsRaw,
			primaryKey,
			tableName,
			updateField,
		} = data;

		const params = SharedHelpers.clearUndefinedFields(paramsRaw);
		const k = Object.keys(params);
		const v = Object.values(params);

		if (!k.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(paramsRaw).join(", ")}`);

		let updateFields = k.map((e: string) => `${e} = ?`).join(",");

		if (updateField) {
			updateFields += `, ${updateField.title} = ${generateTimestampQuery(updateField.type)}`;
		}

		const query = `UPDATE ${tableName} SET ${updateFields} WHERE ${primaryKey.field} = ?;`;

		return { query, values: [...v, primaryKey.value] };
	}
}
