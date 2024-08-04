import mysql from "mysql2/promise";

import * as Helpers from "./helpers/index.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import queries from "./queries.js";

export class BaseModel {
	#sortingOrders = new Set(["ASC", "DESC"]);
	#tableFieldsSet;

	createField;
	isPKAutoIncremented;
	pool: mysql.Pool;
	primaryKey;
	tableFields;
	tableName;
	updateField;

	constructor(
		data: Types.TTable,
		dbCreds: Types.TDBCreds,
	) {
		this.createField = data.createField;
		this.pool = connection.getStandardPool(dbCreds);
		this.primaryKey = data.primaryKey;
		this.isPKAutoIncremented = typeof data.isPKAutoIncremented === "boolean"
			? data.isPKAutoIncremented
			: true;
		this.tableName = data.tableName;
		this.tableFields = data.tableFields;
		this.updateField = data.updateField;

		this.#tableFieldsSet = new Set([
			...this.tableFields,
			...(data.additionalSortingFields || []),
		] as const);
	}

	compareFields = Helpers.compareFields;
	getFieldsToSearch = Helpers.getFieldsToSearch;

	async deleteOneByPk(primaryKey: SharedTypes.TPrimaryKeyValue) {
		await this.pool.query(
			queries.deleteByPk(this.tableName, this.primaryKey),
			Array.isArray(primaryKey) ? primaryKey : [primaryKey],
		);
	}

	async deleteAll() {
		await this.pool.query(queries.deleteAll(this.tableName));
	}

	async getArrByParams(
		{ $and = {}, $or }: {
			$and: Types.TSearchParams;
			$or?: Types.TSearchParams[];
		},
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	) {
		if (order?.length) {
			for (const o of order) {
				if (!this.#tableFieldsSet.has(o.orderBy)) {
					const allowedFields = Array.from(this.#tableFieldsSet).join(", ");

					throw new Error(`Invalid orderBy: ${o.orderBy}. Allowed fields are: ${allowedFields}`);
				}

				if (!this.#sortingOrders.has(o.ordering)) {
					throw new Error("Invalid ordering");
				}
			}
		}

		if (!selected.length) selected.push("*");

		const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
		const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, pagination, order);

		const [rows] = (await this.pool.query<mysql.RowDataPacket[]>(
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

	async getCountByParams(
		{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
	) {
		const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
		const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

		const [[entity]] = (await this.pool.query<mysql.RowDataPacket[]>(
			queries.getCountByParams(this.tableName, searchFields),
			values,
		));

		return Number(entity?.count) || 0;
	}

	async getOneByParams(
		{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
	) {
		if (!selected.length) selected.push("*");

		const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
		const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, { limit: 1, offset: 0 });

		const [[entity]] = (await this.pool.query<mysql.RowDataPacket[]>(
			queries.getByParams(
				this.tableName,
				selectedFields,
				searchFields,
				orderByFields,
				paginationFields,
			),
			values,
		));

		return entity;
	}

	async getOneByPk(primaryKey: SharedTypes.TPrimaryKeyValue) {
		const [[entity]] = (await this.pool.query<mysql.RowDataPacket[]>(
			queries.getOneByPk(this.tableName, this.primaryKey),
			Array.isArray(primaryKey) ? primaryKey : [primaryKey],
		));

		return entity;
	}

	async save(params = {}): Promise<number> {
		const clearedParams = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(clearedParams);

		const [rows]: [mysql.ResultSetHeader, mysql.FieldPacket[]] = await this.pool.query(
			queries.save(this.tableName, fields, this.createField),
			Object.values(clearedParams),
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
		const clearedParams = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(clearedParams);
		const primaryKeyValue = Array.isArray(primaryKey) ? [...primaryKey] : [primaryKey];

		await this.pool.query(
			queries.update(this.tableName, fields, this.primaryKey, this.updateField),
			[...Object.values(clearedParams), ...primaryKeyValue],
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
		F extends SharedTypes.TRawParams = SharedTypes.TRawParams,
	>(data: {
		params: F;
		tableName: string;
	}) {
		const {
			params: paramsRaw,
			tableName,
		} = data;

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
	}) {
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
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = UTC_TIMESTAMP()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

		const query = `UPDATE ${tableName} SET ${updateFields} WHERE ${primaryKey.field} = ?;`;

		return { query, values: [...v, primaryKey.value] };
	}
}
