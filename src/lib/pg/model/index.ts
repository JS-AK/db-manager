import pg from "pg";

import * as Helpers from "./helpers/index.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import queries from "./queries.js";

export class BaseModel {
	#insertOptions;
	#possibleOrderings = new Set(["ASC", "DESC"]);
	#tableFieldsSet;

	createField;
	pool: pg.Pool;
	primaryKey;
	tableName;
	tableFields;
	updateField;

	constructor(
		tableData: Types.TTable,
		dbCreds: Types.TDBCreds,
		options?: Types.TDBOptions,
	) {
		this.createField = tableData.createField;
		this.pool = connection.getStandardPool(dbCreds);
		this.primaryKey = tableData.primaryKey;
		this.tableName = tableData.tableName;
		this.tableFields = tableData.tableFields;
		this.updateField = tableData.updateField;

		this.#insertOptions = options?.insertOptions;
		this.#tableFieldsSet = new Set(this.tableFields);
	}

	compareFields = Helpers.compareFields;

	compareQuery = {
		deleteAll: (): { query: string; values: unknown[]; } => {
			return { query: queries.deleteAll(this.tableName), values: [] };
		},
		deleteByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { fields, fieldsOr, nullFields, values } = this.compareFields($and, $or);
			const { searchFields } = this.getFieldsToSearch({ fields, fieldsOr, nullFields });

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
					if (!this.#tableFieldsSet.has(o.orderBy)) { throw new Error("Invalid orderBy"); }
					if (!this.#possibleOrderings.has(o.ordering)) { throw new Error("Invalid ordering"); }
				}
			}

			if (!selected.length) selected.push("*");

			const { fields, fieldsOr, nullFields, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ fields, fieldsOr, nullFields }, selected, pagination, order);

			return {
				query: queries.getByParams(this.tableName, selectedFields, searchFields, orderByFields, paginationFields),
				values,
			};
		},
		getCountByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { fields, fieldsOr, nullFields, values } = this.compareFields($and, $or);
			const { searchFields } = this.getFieldsToSearch({ fields, fieldsOr, nullFields });

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
			const { fields, fieldsOr, nullFields, values } = this.compareFields($and, $or);
			const { orderNumber, searchFields } = this.getFieldsToSearch({ fields, fieldsOr, nullFields });

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

			const { fields, fieldsOr, nullFields, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ fields, fieldsOr, nullFields }, selected, { limit: 1, offset: 0 });

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
		save: (params = {}): { query: string; values: unknown[]; } => {
			const clearedParams = SharedHelpers.clearUndefinedFields(params);
			const fields = Object.keys(clearedParams);
			const onConflict = this.#insertOptions?.isOnConflictDoNothing ? "ON CONFLICT DO NOTHING" : "";

			if (!fields.length) { throw new Error("No one save field arrived"); }

			return {
				query: queries.save(this.tableName, fields, this.createField, onConflict),
				values: Object.values(clearedParams),
			};
		},
		updateByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			update: SharedTypes.TRawParams = {},
		): { query: string; values: unknown[]; } => {
			const { fields, fieldsOr, nullFields, values } = this.compareFields($and, $or);
			const { orderNumber, searchFields } = this.getFieldsToSearch({ fields, fieldsOr, nullFields });
			const clearedUpdate = SharedHelpers.clearUndefinedFields(update);
			const fieldsToUpdate = Object.keys(clearedUpdate);

			if (!fields.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByParams(this.tableName, fieldsToUpdate, searchFields, this.updateField, orderNumber + 1),
				values: [...values, ...Object.values(clearedUpdate)],
			};
		},
		updateOneByPk: <T = string | number>(
			pk: T,
			update: SharedTypes.TRawParams = {},
		): { query: string; values: unknown[]; } => {
			const clearedParams = SharedHelpers.clearUndefinedFields(update);
			const fields = Object.keys(clearedParams);

			if (!fields.length) throw new Error("No one update field arrived");

			return {
				query: queries.updateByPk(this.tableName, fields, this.primaryKey as string, this.updateField),
				values: [...Object.values(clearedParams), pk],
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

	getFieldsToSearch = Helpers.getFieldsToSearch;

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

	async save(params = {}) {
		const sql = this.compareQuery.save(params);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	async updateByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		update: SharedTypes.TRawParams = {},
	) {
		const sql = this.compareQuery.updateByParams(params, update);
		const { rows } = await this.pool.query(sql.query, sql.values);

		return rows;
	}

	async updateOneByPk<T = string | number>(
		pk: T,
		update: SharedTypes.TRawParams = {},
	) {
		if (!this.primaryKey) { throw new Error("Primary key not specified"); }

		const sql = this.compareQuery.updateOneByPk(pk, update);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	/**
	 * @experimental
	 */
	queryBuilder(options?: { tableName?: string; client?: pg.Pool | pg.PoolClient; }) {
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

		const query = `INSERT INTO ${tableName}(${k.join(",")}) VALUES(${k.map((e, idx) => "$" + ++idx).join(",")}) ${returningSQL};`;

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
