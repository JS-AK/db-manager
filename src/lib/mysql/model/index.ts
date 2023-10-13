import mysql from "mysql2/promise";

import * as Helpers from "./helpers.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { getStandardPool, getTransactionPool } from "../connection.js";
import queries from "./queries.js";

export class BaseModel {
	#possibleOrderings = new Set(["ASC", "DESC"]);
	#tableFieldsSet;

	createField;
	isPKAutoIncremented;
	pool: mysql.Pool;
	primaryKey;
	tableFields;
	tableName;
	updateField;

	constructor(tableData: Types.TTable, options: Types.TDBCreds) {
		this.createField = tableData.createField;
		this.pool = getStandardPool(options);
		this.primaryKey = tableData.primaryKey;
		this.isPKAutoIncremented = typeof tableData.isPKAutoIncremented === "boolean"
			? tableData.isPKAutoIncremented
			: true;
		this.tableName = tableData.tableName;
		this.tableFields = tableData.tableFields;
		this.updateField = tableData.updateField;

		this.#tableFieldsSet = new Set(this.tableFields);
	}

	compareFields = Helpers.compareFields;

	async delete(primaryKey: SharedTypes.TPrimaryKeyValue) {
		await this.pool.query(
			queries.delete(this.tableName, this.primaryKey),
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
					throw new Error("Invalid orderBy");
				}

				if (!this.#possibleOrderings.has(o.ordering)) {
					throw new Error("Invalid ordering");
				}
			}
		}

		if (!selected.length) selected.push("*");

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
			pagination,
			order,
		);

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
		const [rows] = (await this.pool.query<mysql.RowDataPacket[]>(
			queries.getCountByParams(this.tableName, fields, nullFields),
			values,
		));

		if (!rows[0]) return 0;

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
		if (!selected.length) selected.push("*");

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

		return rows[0];
	}

	async getOneByPk(primaryKey: SharedTypes.TPrimaryKeyValue) {
		const [rows] = (await this.pool.query<mysql.RowDataPacket[]>(
			queries.getOneByPk(this.tableName, this.primaryKey),
			Array.isArray(primaryKey) ? primaryKey : [primaryKey],
		));

		return rows[0];
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
		return getStandardPool(creds, poolName);
	}

	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): mysql.Pool {
		return getTransactionPool(creds, poolName);
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

		const query = `
		INSERT INTO ${tableName}(
			${k.join(",")}
		)
		VALUES(${k.map(() => "?").join(",")})
	`;

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

		const query = `
		UPDATE ${tableName}
		SET ${updateFields}
		WHERE ${primaryKey.field} = ?
	`;

		return { query, values: [...v, primaryKey.value] };
	}
}
