import pg from "pg";

import * as Helpers from "./helpers.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { getStandartPool, getTransactionPool } from "../connection.js";
import queries from "./queries.js";

export class BaseModel {
	createField;
	creds;
	pool: pg.Pool;
	primaryKey;
	tableName;
	tableFields;
	transactionPool: pg.Pool;
	updateField;

	constructor(tableData: Types.TTable, options: Types.TDBCreds) {
		this.createField = tableData.createField;
		this.creds = {
			database: options.database,
			host: options.host,
			password: options.host,
			port: options.port,
			user: options.user,
		};
		this.pool = getStandartPool(options);
		this.primaryKey = tableData.primaryKey;
		this.transactionPool = getTransactionPool(options);
		this.tableName = tableData.tableName;
		this.tableFields = tableData.tableFields;
		this.updateField = tableData.updateField;
	}

	compareFields = Helpers.compareFields;

	async delete<T = string | number>(primaryKey: T): Promise<T | null> {
		const res = (await this.pool.query(
			queries.delete(this.tableName, this.primaryKey),
			[primaryKey],
		)).rows[0];

		return res?.[this.primaryKey] || null;
	}

	async deleteAll(): Promise<void> {
		await this.pool.query(queries.deleteAll(this.tableName));
	}

	async getArrByParams(
		{ $and = {}, $or }: {
			$and: Types.TSearchParams;
			$or?: Types.TSearchParams[];
		},
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		orderBy?: string,
		ordering?: SharedTypes.TOrdering,
	) {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = this.compareFields($and, $or);
		const checkOrder = orderBy && ordering;
		const {
			orderByFields,
			paginationFields,
			searchFields,
			selectedFields,
		} = this.getFieldsToSearch(
			{ fields, fieldsOr, nullFields },
			selected,
			pagination,
			checkOrder ? { orderBy, ordering } : undefined,
		);

		const res = (await this.pool.query(
			queries.getByParams(
				this.tableName,
				selectedFields,
				searchFields,
				orderByFields,
				paginationFields,
			),
			values,
		)).rows;

		return res;
	}

	async getCountByPks(pks: string[]) {
		const res = (await this.pool.query(
			queries.getCountByPks(this.primaryKey, this.tableName),
			[pks],
		)).rows[0];

		return parseInt(res.count);
	}

	async getCountByPksAndParams(
		pks: string[],
		{ $and = {}, $or }: {
			$and: Types.TSearchParams;
			$or?: Types.TSearchParams[];
		},
	) {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = this.compareFields($and, $or);
		const {
			orderNumber,
			searchFields,
		} = this.getFieldsToSearch({ fields, fieldsOr, nullFields });

		const res = (await this.pool.query(
			queries.getCountByPksAndParams(
				this.primaryKey,
				this.tableName,
				searchFields,
				orderNumber,
			),
			[...values, pks],
		)).rows[0];

		return parseInt(res.count, 10);
	}

	async getCountByParams({ $and = {}, $or }: {
		$and: Types.TSearchParams;
		$or?: Types.TSearchParams[];
	}) {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = this.compareFields($and, $or);
		const {
			searchFields,
		} = this.getFieldsToSearch({ fields, fieldsOr, nullFields });

		const res = (await this.pool.query(
			queries.getCountByParams(
				this.tableName,
				searchFields,
			),
			values,
		)).rows[0];

		return parseInt(res.count, 10);
	}

	getFieldsToSearch = Helpers.getFieldsToSearch;

	async getOneByParams(
		{ $and = {}, $or }: {
			$and: Types.TSearchParams;
			$or?: Types.TSearchParams[];
		},
		selected = ["*"],
	) {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = this.compareFields($and, $or);
		const {
			orderByFields,
			paginationFields,
			searchFields,
			selectedFields,
		} = this.getFieldsToSearch(
			{ fields, fieldsOr, nullFields },
			selected,
		);

		const res = (await this.pool.query(
			queries.getByParams(
				this.tableName,
				selectedFields,
				searchFields,
				orderByFields,
				paginationFields,
			),
			values,
		)).rows;

		return res[0];
	}

	async getOneByPk(pk: string) {
		const res = (await this.pool.query(
			queries.getOneByPk(this.tableName, this.primaryKey),
			[pk],
		)).rows;

		return res[0];
	}

	async save(params = {}) {
		const prms = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(prms);

		if (!fields.length) throw new Error("No one params incoming to save");

		const res = (await this.pool.query(
			queries.save(this.tableName, fields, this.createField),
			Object.values(prms),
		)).rows;

		return res[0];
	}

	async update(
		pk: string,
		params: SharedTypes.TRawParams = {},
	) {
		const prms = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(prms);

		if (!fields.length) throw new Error("No one params incoming to update");

		const res = (await this.pool.query(
			queries.update(this.tableName, fields, this.primaryKey, this.updateField),
			[...Object.values(prms), pk],
		)).rows;

		return res[0];
	}

	// STATIC METHODS
	static getStandartPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return getStandartPool(creds, poolName);
	}

	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): pg.Pool {
		return getTransactionPool(creds, poolName);
	}

	static getInsertFields<
		P extends SharedTypes.TRawParams = SharedTypes.TRawParams,
		F extends string = string
	>(data: {
		params: P;
		returning?: F[];
		tableName: string;
	}) {
		const {
			params: paramsRaw,
			returning,
			tableName,
		} = data;

		const params = SharedHelpers.clearUndefinedFields(paramsRaw);
		const k = Object.keys(params);
		const v = Object.values(params);

		const returningSQL = returning?.length
			? `RETURNING ${returning.join(",")}`
			: "";

		const query = `
			INSERT INTO ${tableName}(
				${k.join(",")}
			)
			VALUES(${k.map((e, idx) => "$" + ++idx).join(",")})
			${returningSQL}
		`;

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
		updateField?: F;
	}) {
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

		let updateFields = k.map((e: string, idx: number) => `${e} = $${idx + 2}`).join(",");

		if (updateField) updateFields += `, ${updateField} = NOW()`;

		const returningSQL = returning?.length
			? `RETURNING ${returning.join(",")}`
			: "";

		const query = `
			UPDATE ${tableName}
			SET ${updateFields}
			WHERE ${primaryKey.field} = $1
			${returningSQL}
		`;

		return { query, values: [primaryKey.value, ...v] };
	}
}
