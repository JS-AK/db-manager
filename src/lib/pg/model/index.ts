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

	constructor(tableData: Types.TTable, creds: Types.TDBCreds) {
		this.createField = tableData.createField;
		this.creds = creds;
		this.pool = getStandartPool(creds);
		this.primaryKey = tableData.primaryKey;
		this.transactionPool = getTransactionPool(creds);
		this.tableName = tableData.tableName;
		this.tableFields = tableData.tableFields;
		this.updateField = tableData.updateField;
	}

	compareFields = Helpers.compareFields;

	async delete(primaryKey: string) {
		const res = (await this.pool.query(
			queries.delete(this.tableName, this.primaryKey),
			[primaryKey],
		)).rows;

		return res.map((e) => e[this.primaryKey])[0];
	}

	async deleteAll() {
		const res = (await this.pool.query(
			queries.deleteAll(this.tableName, this.primaryKey),
		)).rows;

		return res.map((e) => e[this.primaryKey]);
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
			valuesOr,
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
			[...values, ...valuesOr],
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
			valuesOr,
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
			[...values, ...valuesOr, pks],
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
			valuesOr,
		} = this.compareFields($and, $or);
		const {
			searchFields,
		} = this.getFieldsToSearch({ fields, fieldsOr, nullFields });

		const res = (await this.pool.query(
			queries.getCountByParams(
				this.tableName,
				searchFields,
			),
			[...values, ...valuesOr],
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
			valuesOr,
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
			[...values, ...valuesOr],
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
	static getStandartPool(creds: Types.TDBCreds): pg.Pool {
		return getStandartPool(creds);
	}

	static getTransactionPool(creds: Types.TDBCreds): pg.Pool {
		return getTransactionPool(creds);
	}

	static getInsertFields(
		fields: { [key: string]: string | string[] | number | boolean | null | undefined; },
		tableName: string,
	) {
		const params = SharedHelpers.clearUndefinedFields(fields);
		const k = Object.keys(params);
		const v = Object.values(params);

		const query = `
			INSERT INTO ${tableName}(
				${k.join(",")},
				created_at
			)
			VALUES(${k.map((e, idx) => "$" + ++idx).join(",")}, NOW())
			RETURNING id
		`;

		return { query, values: v };
	}

	static getUpdateFields(
		id: string,
		fields: { [key: string]: string | string[] | number | null | boolean | undefined; },
		tableName: string,
		updateField?: string,
	) {
		const params = SharedHelpers.clearUndefinedFields(fields);
		const k = Object.keys(params);
		const v = Object.values(params);

		let updateFields = k.map((e: string, idx: number) => `${e} = $${idx + 2}`).join(",");

		if (updateField) updateFields += `, ${updateField} = NOW()`;

		const query = `
			UPDATE ${tableName}
			SET ${updateFields}
			WHERE id = $1
		`;

		return { query, values: [id, ...v] };
	}
}
