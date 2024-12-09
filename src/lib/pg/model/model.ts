import pg from "pg";

import * as Helpers from "../helpers/index.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import queries from "./queries.js";
import { setLoggerAndExecutor } from "../helpers/index.js";

export class BaseModel<const T extends readonly string[] = readonly string[]> {
	#insertOptions;
	#sortingOrders = new Set(["ASC", "DESC"]);
	#tableFieldsSet;
	#isLoggerEnabled: boolean | undefined;
	#logger?: SharedTypes.TLogger;
	#executeSql;

	createField;
	pool: pg.Pool;
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
		this.pool = connection.getStandardPool(dbCreds);
		this.primaryKey = data.primaryKey;
		this.tableName = data.tableName;
		this.tableFields = [...data.tableFields];
		this.updateField = data.updateField;

		this.#tableFieldsSet = new Set([
			...this.tableFields,
			...(data.additionalSortingFields || []),
		] as const);

		const { insertOptions, isLoggerEnabled, logger } = options || {};

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
			const { orderNumber, searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			if (Array.isArray(pks[0])) {
				if (!Array.isArray(this.primaryKey)) { throw new Error("invalid primary key type"); }

				return {
					query: queries.getCountByCompositePksAndParams(this.primaryKey, this.tableName, searchFields, orderNumber, pks.length),
					values: pks.flat(),
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
		getOneByPk: <T>(pk: T): { query: string; values: unknown[]; } => {
			if (!this.primaryKey) { throw new Error("Primary key not specified"); }

			return {
				query: queries.getOneByPk(this.tableName, this.primaryKey),
				values: [pk],
			};
		},
		save: (
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
				values: [...Object.values(clearedParams), primaryKeyValue],
			};
		},
	};

	async deleteAll(): Promise<void> {
		const sql = this.compareQuery.deleteAll();

		await this.#executeSql(sql);

		return;
	}

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

	async deleteByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	): Promise<null> {
		const sql = this.compareQuery.deleteByParams(params);

		await this.#executeSql(sql);

		return null;
	}

	async getArrByParams<T extends pg.QueryResultRow>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	) {
		const sql = this.compareQuery.getArrByParams(params, selected, pagination, order);
		const { rows } = await this.#executeSql<T>(sql);

		return rows;
	}

	async getCountByPks<T>(pks: T[]): Promise<number> {
		const sql = this.compareQuery.getCountByPks(pks);
		const { rows: [entity] } = await this.#executeSql(sql);

		return Number(entity?.count) || 0;
	}

	async getCountByPksAndParams<T>(
		pks: T[],
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	) {
		const sql = this.compareQuery.getCountByPksAndParams(pks, params);
		const { rows: [entity] } = await this.#executeSql(sql);

		return Number(entity?.count) || 0;
	}

	async getCountByParams(params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; }) {
		const sql = this.compareQuery.getCountByParams(params);
		const { rows: [entity] } = await this.#executeSql(sql);

		return Number(entity?.count) || 0;
	}

	async getOneByParams<T extends pg.QueryResultRow>(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
	) {
		const sql = this.compareQuery.getOneByParams(params, selected);
		const { rows: [entity] } = await this.#executeSql<T>(sql);

		return entity;
	}

	async getOneByPk<T>(pk: T) {
		const sql = this.compareQuery.getOneByPk(pk);
		const { rows: [entity] } = await this.#executeSql(sql);

		return entity;
	}

	async save<T extends pg.QueryResultRow>(
		recordParams = {},
		saveOptions?: { returningFields?: string[]; },
	) {
		const sql = this.compareQuery.save(recordParams, saveOptions);
		const { rows: [entity] } = await this.#executeSql<T>(sql);

		return entity;
	}

	async updateByParams(
		queryConditions: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; returningFields?: string[]; },
		updateFields: SharedTypes.TRawParams = {},
	) {
		const sql = this.compareQuery.updateByParams(queryConditions, updateFields);
		const { rows } = await this.#executeSql(sql);

		return rows;
	}

	async updateOneByPk<Q extends pg.QueryResultRow, T>(
		primaryKeyValue: T,
		updateFields: SharedTypes.TRawParams = {},
		updateOptions?: { returningFields?: string[]; },
	) {
		const sql = this.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions);
		const { rows: [entity] } = await this.#executeSql<Q>(sql);

		return entity;
	}

	/**
	 * @experimental
	 */
	queryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient | pg.Client;
		tableName?: string;
	}) {
		const { client, tableName } = options || {};

		return new QueryBuilder(
			tableName ?? this.tableName,
			client ?? this.pool,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);
	}

	// STATIC METHODS
	static getStandardPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return connection.getStandardPool(creds, poolName);
	}

	static async removeStandardPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeStandardPool(creds, poolName);
	}

	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return connection.getTransactionPool(creds, poolName);
	}

	static async removeTransactionPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeTransactionPool(creds, poolName);
	}

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
