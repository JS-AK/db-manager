import pg from "pg";

import * as Helpers from "./helpers/index.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import queries from "./queries.js";

export class BaseTable {
	#insertOptions;
	#sortingOrders = new Set(["ASC", "DESC"]);

	createField;
	pool: pg.Pool;
	primaryKey;
	tableName;
	tableFields;
	updateField;

	constructor(
		data: Types.TTable,
		dbCreds: Types.TDBCreds,
		options?: Types.TDBOptions,
	) {
		this.createField = data.createField;
		this.pool = connection.getStandardPool(dbCreds);
		this.primaryKey = data.primaryKey;
		this.tableName = data.tableName;
		this.tableFields = data.tableFields;
		this.updateField = data.updateField;

		this.#insertOptions = options?.insertOptions;
	}

	compareFields = Helpers.compareFields;
	getFieldsToSearch = Helpers.getFieldsToSearch;

	compareQuery = {
		deleteAll: (): { query: string; values: unknown[]; } => {
			return { query: queries.deleteAll(this.tableName), values: [] };
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
		deleteOneByPk: <T = string | number>(primaryKey: T): { query: string; values: unknown[]; } => {
			return {
				query: queries.deleteByPk(this.tableName, this.primaryKey as string),
				values: [primaryKey],
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
		getCountByPks: <T = string | number>(pks: T[]): { query: string; values: unknown[]; } => {
			return {
				query: queries.getCountByPks(this.primaryKey as string, this.tableName),
				values: [pks],
			};
		},
		getCountByPksAndParams: <T = string | number>(
			pks: T[],
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderNumber, searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			return {
				query: queries.getCountByPksAndParams(this.primaryKey as string, this.tableName, searchFields, orderNumber),
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
		getOneByPk: <T = string | number>(pk: T): { query: string; values: unknown[]; } => {
			return {
				query: queries.getOneByPk(this.tableName, this.primaryKey as string),
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
				query: queries.save(this.tableName, fields, this.createField, onConflict, saveOptions?.returningFields),
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
		updateOneByPk: <T extends string | number = string | number > (
			primaryKeyValue: T,
			updateFields: SharedTypes.TRawParams = {},
			updateOptions?: { returningFields?: string[]; },
		): { query: string; values: unknown[]; } => {
			const clearedParams = SharedHelpers.clearUndefinedFields(updateFields);
			const fields = Object.keys(clearedParams);

			if (!fields.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByPk(this.tableName, fields, this.primaryKey as string, this.updateField, updateOptions?.returningFields),
				values: [...Object.values(clearedParams), primaryKeyValue],
			};
		},
	};

	async deleteAll(): Promise<void> {
		const sql = this.compareQuery.deleteAll();

		await this.pool.query(sql.query, sql.values);

		return;
	}

	async deleteOneByPk<T = string | number>(primaryKey: T): Promise<T | null> {
		if (!this.primaryKey) { throw new Error("Primary key not specified"); }

		const sql = this.compareQuery.deleteOneByPk(primaryKey);
		const { rows: [entity] } = (await this.pool.query(sql.query, sql.values));

		return entity?.[this.primaryKey] || null;
	}

	async deleteByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	): Promise<null> {
		const sql = this.compareQuery.deleteByParams(params);

		await this.pool.query(sql.query, sql.values);

		return null;
	}

	async getArrByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	) {
		const sql = this.compareQuery.getArrByParams(params, selected, pagination, order);
		const { rows } = await this.pool.query(sql.query, sql.values);

		return rows;
	}

	async getCountByPks<T = string | number>(pks: T[]): Promise<number> {
		if (!this.primaryKey) { throw new Error("Primary key not specified"); }

		const sql = this.compareQuery.getCountByPks(pks);
		const { rows: [entity] } = await this.pool.query<{ count: string; }>(sql.query, sql.values);

		return Number(entity?.count) || 0;
	}

	async getCountByPksAndParams<T = string | number>(
		pks: T[],
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	) {
		if (!this.primaryKey) { throw new Error("Primary key not specified"); }

		const sql = this.compareQuery.getCountByPksAndParams(pks, params);
		const { rows: [entity] } = await this.pool.query<{ count: string; }>(sql.query, sql.values);

		return Number(entity?.count) || 0;
	}

	async getCountByParams(params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; }) {
		const sql = this.compareQuery.getCountByParams(params);
		const { rows: [entity] } = await this.pool.query<{ count: string; }>(sql.query, sql.values);

		return Number(entity?.count) || 0;
	}

	async getOneByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
	) {
		const sql = this.compareQuery.getOneByParams(params, selected);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	async getOneByPk<T = string | number>(pk: T) {
		if (!this.primaryKey) { throw new Error("Primary key not specified"); }

		const sql = this.compareQuery.getOneByPk(pk);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	async save(
		recordParams = {},
		saveOptions?: { returningFields?: string[]; },
	) {
		const sql = this.compareQuery.save(recordParams, saveOptions);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	async updateByParams(
		queryConditions: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; returningFields?: string[]; },
		updateFields: SharedTypes.TRawParams = {},
	) {
		const sql = this.compareQuery.updateByParams(queryConditions, updateFields);
		const { rows } = await this.pool.query(sql.query, sql.values);

		return rows;
	}

	async updateOneByPk<T extends string | number = string | number>(
		primaryKeyValue: T,
		updateFields: SharedTypes.TRawParams = {},
		updateOptions?: { returningFields?: string[]; },
	) {
		if (!this.primaryKey) { throw new Error("Primary key not specified"); }

		const sql = this.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	/**
	 * @experimental
	 */
	queryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient;
		tableName?: string;
	}) {
		const { client, tableName } = options || {};

		return new QueryBuilder(tableName || this.tableName, client || this.pool);
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
