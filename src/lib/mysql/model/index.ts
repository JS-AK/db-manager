import mysql from "mysql2";

import * as Helpers from "./helpers.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { getStandartPool, getTransactionPool } from "../connection.js";
import queries from "./queries.js";

export class BaseModel {
	createField;
	creds;
	isPKAutoIncremented;
	pool: mysql.Pool;
	primaryKey;
	tableFields;
	tableName;
	updateField;

	constructor(tableData: Types.TTable, creds: Types.TDBCreds) {
		this.createField = tableData.createField;
		this.creds = creds;
		this.pool = getStandartPool(creds);
		this.primaryKey = tableData.primaryKey;
		this.isPKAutoIncremented = typeof tableData.isPKAutoIncremented === "boolean"
			? tableData.isPKAutoIncremented
			: true;
		this.tableName = tableData.tableName;
		this.tableFields = tableData.tableFields;
		this.updateField = tableData.updateField;
	}

	compareFields = Helpers.compareFields;

	async delete(primaryKey: SharedTypes.TPrimaryKeyValue) {
		await this.pool.promise().query(
			queries.delete(this.tableName, this.primaryKey),
			Array.isArray(primaryKey) ? primaryKey : [primaryKey],
		);
	}

	async deleteAll() {
		await this.pool.promise().query(queries.deleteAll(this.tableName));
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

		const [rows]: any[] = (await this.pool.promise().query(
			queries.getByParams(
				this.tableName,
				selectedFields,
				searchFields,
				orderByFields,
				paginationFields,
			),
			values,
		));

		return rows;
	}

	async getCountByParams(params = {}) {
		const fields = [];
		const values = [];
		const nullFields = [];

		for (const [key, value] of Object.entries(params)) {
			if (value === null) {
				nullFields.push(`${key} IS NULL`);
			} else {
				fields.push(key);
				values.push(value);
			}
		}
		const [rows]: any[] = (await this.pool.promise().query(
			queries.getCountByParams(this.tableName, fields, nullFields),
			values,
		));

		return parseInt(rows[0].count, 10);
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

		const [rows]: any[] = (await this.pool.promise().query(
			queries.getByParams(
				this.tableName,
				selectedFields,
				searchFields,
				orderByFields,
				paginationFields,
			),
			values,
		));

		return rows[0];
	}

	async getOneByPk(primaryKey: SharedTypes.TPrimaryKeyValue) {
		const [rows]: any[] = (await this.pool.promise().query(
			queries.getOneByPk(this.tableName, this.primaryKey),
			Array.isArray(primaryKey) ? primaryKey : [primaryKey],
		));

		return rows[0];
	}

	async save(params = {}): Promise<number> {
		const prms = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(prms);

		const [rows]: [mysql.OkPacket, mysql.FieldPacket[]] = await this.pool.promise().query(
			queries.save(this.tableName, fields, this.createField),
			Object.values(prms),
		);

		if (!this.isPKAutoIncremented) {
			return -1;
		}

		return rows.insertId;
	}

	async update(
		primaryKey: SharedTypes.TPrimaryKeyValue,
		params = {},
	) {
		const prms = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(prms);
		const primaryKeyValue = Array.isArray(primaryKey) ? [...primaryKey] : [primaryKey];

		await this.pool.promise().query(
			queries.update(this.tableName, fields, this.primaryKey, this.updateField),
			[...Object.values(prms), ...primaryKeyValue],
		);
	}

	// STATIC METHODS
	static getStandartPool(creds: Types.TDBCreds): mysql.Pool {
		return getStandartPool(creds);
	}

	static getTransactionPool(creds: Types.TDBCreds): mysql.Pool {
		return getTransactionPool(creds);
	}
}
