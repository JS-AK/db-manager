import pg from "pg";

import * as Helpers from "./helpers.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
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

	async deleteAll(): Promise<void> {
		await this.pool.query(queries.deleteAll(this.tableName));
	}

	async deleteOneByPk<T = string | number>(primaryKey: T): Promise<T | null> {
		if (!this.primaryKey) {
			throw new Error("Primary key not specified");
		}

		const res = (await this.pool.query(
			queries.deleteByPk(this.tableName, this.primaryKey),
			[primaryKey],
		)).rows[0];

		return res?.[this.primaryKey] || null;
	}

	async deleteByParams(
		{ $and = {}, $or }: {
			$and: Types.TSearchParams;
			$or?: Types.TSearchParams[];
		},
	): Promise<null> {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = this.compareFields($and, $or);

		const {
			searchFields,
		} = this.getFieldsToSearch(
			{ fields, fieldsOr, nullFields },
		);

		await this.pool.query(
			queries.deleteByParams(this.tableName, searchFields),
			values,
		);

		return null;
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
		if (!this.primaryKey) {
			throw new Error("Primary key not specified");
		}

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
		if (!this.primaryKey) {
			throw new Error("Primary key not specified");
		}

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
		if (!this.primaryKey) {
			throw new Error("Primary key not specified");
		}

		const res = (await this.pool.query(
			queries.getOneByPk(this.tableName, this.primaryKey),
			[pk],
		)).rows;

		return res[0];
	}

	async save(params = {}) {
		const clearedParams = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(clearedParams);
		const onConflict = this.#insertOptions?.isOnConflictDoNothing
			? "ON CONFLICT DO NOTHING"
			: "";

		if (!fields.length) throw new Error("No one params incoming to save");

		const res = (await this.pool.query(
			queries.save(this.tableName, fields, this.createField, onConflict),
			Object.values(clearedParams),
		)).rows;

		return res[0];
	}

	async updateByParams(
		{ $and = {}, $or }: {
			$and: Types.TSearchParams;
			$or?: Types.TSearchParams[];
		},
		params: SharedTypes.TRawParams = {},
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
		} = this.getFieldsToSearch(
			{ fields, fieldsOr, nullFields },
		);

		const clearedParams = SharedHelpers.clearUndefinedFields(params);
		const fieldsToUpdate = Object.keys(clearedParams);

		if (!fields.length) throw new Error("No one params incoming to update");

		const res = (await this.pool.query(
			queries.updateByParams(
				this.tableName,
				fieldsToUpdate,
				searchFields,
				this.updateField,
				orderNumber + 1,
			),
			[...values, ...Object.values(clearedParams)],
		)).rows;

		return res;
	}

	async updateOneByPk(
		pk: string,
		params: SharedTypes.TRawParams = {},
	) {
		if (!this.primaryKey) {
			throw new Error("Primary key not specified");
		}

		const clearedParams = SharedHelpers.clearUndefinedFields(params);
		const fields = Object.keys(clearedParams);

		if (!fields.length) throw new Error("No one params incoming to update");

		const res = (await this.pool.query(
			queries.updateByPk(this.tableName, fields, this.primaryKey, this.updateField),
			[...Object.values(clearedParams), pk],
		)).rows;

		return res[0];
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
		updateField?: { title: F; type: "unix_timestamp" | "timestamp"; } | null;
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

		if (updateField) {
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = NOW()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = (EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

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
