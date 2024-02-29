import pg from "pg";

import * as DomainTypes from "../domain/types.js";
import * as Helpers from "../model/helpers.js";
import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";

const operatorMappings: Map<
	string,
	(el: ModelTypes.TField, orderNumber: number) => [string, number]
> = new Map([
	[
		"$custom",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} ${el.sign} $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$between",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} BETWEEN $${orderNumber + 1} AND $${orderNumber + 2}`, orderNumber + 2],
	],
	[
		"$in",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} = ANY ($${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$like",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} LIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$ilike",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} ILIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$nin",
		(el: ModelTypes.TField, orderNumber: number) => [`NOT (${el.key} = ANY ($${orderNumber + 1}))`, orderNumber + 1],
	],
	[
		"$nbetween",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} NOT BETWEEN $${orderNumber + 1} AND $${orderNumber + 2}`, orderNumber + 2],
	],
	[
		"$nlike",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} NOT LIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$nilike",
		(el: ModelTypes.TField, orderNumber: number) => [`${el.key} NOT ILIKE $${orderNumber + 1}`, orderNumber + 1],
	],
]);

export class QueryBuilder {
	#mainFrom: string;
	#mainSelect = "";
	#mainHaving = "";
	#mainWhere = "";
	#groupBy = "";
	#orderBy = "";
	#valuesOrder: number;
	#join: string[] = [];
	#pagination = "";
	#tableName;
	#values: unknown[] = [];

	#pool;

	constructor(tableName: string, pool: pg.Pool) {
		this.#mainFrom = `FROM ${tableName}`;
		this.#tableName = tableName;
		this.#valuesOrder = 0;

		this.#pool = pool;
	}

	#compareSql() {
		let sql = this.#mainSelect + this.#mainFrom;

		if (this.#join.length) sql += "\r\n" + this.#join.join("\r\n");
		if (this.#mainWhere) sql += "\r\n" + this.#mainWhere;
		if (this.#groupBy) sql += "\r\n" + this.#groupBy;
		if (this.#mainHaving) sql += "\r\n" + this.#mainHaving;
		if (this.#orderBy) sql += "\r\n" + this.#orderBy;
		if (this.#pagination) sql += "\r\n" + this.#pagination;

		return sql + ";";
	}

	getSql() {
		return this.#compareSql();
	}

	select(arr: string[]) {
		this.#mainSelect = `SELECT ${arr.join(", ")}\r\n`;

		return this;
	}

	rawJoin(rawText: string) {
		this.#join.push(rawText);

		return this;
	}

	rightJoin(data: {
		targetTableName: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#join.push(`RIGHT JOIN ${data.targetTableName} ON ${data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	leftJoin(data: {
		targetTableName: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#join.push(`LEFT JOIN ${data.targetTableName} ON ${data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	innerJoin(data: {
		targetTableName: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#join.push(`INNER JOIN ${data.targetTableName} ON ${data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#join.push(`FULL OUTER JOIN ${data.targetTableName} ON ${data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	where(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = Helpers.compareFields(data.params as ModelTypes.TSearchParams, data.paramsOr);

		if (fields.length) {
			if (!this.#mainWhere) this.#mainWhere += "WHERE ";

			this.#mainWhere += fields.map((e: ModelTypes.TField) => {
				const operatorFunction = operatorMappings.get(e.operator);

				if (operatorFunction) {
					const [text, orderNumber] = operatorFunction(e, this.#valuesOrder);

					this.#valuesOrder = orderNumber;

					return text;
				} else {
					this.#valuesOrder += 1;

					const text = `${e.key} ${e.operator} $${this.#valuesOrder}`;

					return text;
				}
			}).join(" AND ");
		}

		if (nullFields.length) {
			if (this.#mainWhere) {
				this.#mainWhere += ` AND ${nullFields.join(" AND ")}`;
			} else {
				this.#mainWhere += "WHERE ";
				this.#mainWhere += nullFields.join(" AND ");
			}
		}

		if (fieldsOr?.length) {
			const comparedFieldsOr = [];

			for (const row of fieldsOr) {
				const { fields, nullFields } = row;
				let comparedFields = fields.map((e: ModelTypes.TField) => {
					const operatorFunction = operatorMappings.get(e.operator);

					if (operatorFunction) {
						const [text, orderNumber] = operatorFunction(e, this.#valuesOrder);

						this.#valuesOrder = orderNumber;

						return text;
					} else {
						this.#valuesOrder += 1;

						const text = `${e.key} ${e.operator} $${this.#valuesOrder}`;

						return text;
					}
				}).join(" AND ");

				if (nullFields.length) {
					if (comparedFields) comparedFields += ` AND ${nullFields.join(" AND ")}`;
					else comparedFields = nullFields.join(" AND ");
				}

				comparedFieldsOr.push(`(${comparedFields})`);
			}

			if (!this.#mainWhere) {
				this.#mainWhere += `WHERE (${comparedFieldsOr.join(" OR ")})`;
			} else {
				this.#mainWhere += ` AND (${comparedFieldsOr.join(" OR ")})`;
			}
		}

		this.#values.push(...values);

		return this;
	}

	rawWhere(rawText: string) {
		if (!rawText) return this;

		if (!this.#mainWhere) this.#mainWhere += "WHERE ";

		this.#mainWhere += rawText;

		return this;
	}

	pagination(data: { limit: number; offset: number; }) {
		if (typeof data.limit !== "number" || typeof data.offset !== "number") {
			throw new Error("Invalid pagination");
		}

		this.#pagination += `LIMIT ${data.limit} OFFSET ${data.offset}`;

		return this;
	}

	orderBy(data: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]) {
		this.#orderBy += `ORDER BY ${data.map((o) => `${o.column} ${o.sorting}`).join(", ")}`;

		return this;
	}

	groupBy(data: string[]) {
		this.#groupBy += `GROUP BY ${data.join(", ")}`;

		return this;
	}

	having(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		const {
			fields,
			fieldsOr,
			nullFields,
			values,
		} = Helpers.compareFields(data.params as ModelTypes.TSearchParams, data.paramsOr);

		if (fields.length) {
			this.#mainHaving += "HAVING ";
			this.#mainHaving += fields.map((e: ModelTypes.TField) => {
				const operatorFunction = operatorMappings.get(e.operator);

				if (operatorFunction) {
					const [text, orderNumber] = operatorFunction(e, this.#valuesOrder);

					this.#valuesOrder = orderNumber;

					return text;
				} else {
					this.#valuesOrder += 1;

					const text = `${e.key} ${e.operator} $${this.#valuesOrder}`;

					return text;
				}
			}).join(" AND ");
		}

		if (nullFields.length) {
			if (this.#mainHaving) {
				this.#mainHaving += ` AND ${nullFields.join(" AND ")}`;
			} else {
				this.#mainHaving += "HAVING ";
				this.#mainHaving += nullFields.join(" AND ");
			}
		}

		if (fieldsOr?.length) {
			const comparedFieldsOr = [];

			for (const row of fieldsOr) {
				const { fields, nullFields } = row;
				let comparedFields = fields.map((e: ModelTypes.TField) => {
					const operatorFunction = operatorMappings.get(e.operator);

					if (operatorFunction) {
						const [text, orderNumber] = operatorFunction(e, this.#valuesOrder);

						this.#valuesOrder = orderNumber;

						return text;
					} else {
						this.#valuesOrder += 1;

						const text = `${e.key} ${e.operator} $${this.#valuesOrder}`;

						return text;
					}
				}).join(" AND ");

				if (nullFields.length) {
					if (comparedFields) comparedFields += ` AND ${nullFields.join(" AND ")}`;
					else comparedFields = nullFields.join(" AND ");
				}

				comparedFieldsOr.push(`(${comparedFields})`);
			}

			if (!this.#mainHaving) {
				this.#mainHaving += `HAVING (${comparedFieldsOr.join(" OR ")})`;
			} else {
				this.#mainHaving += ` AND (${comparedFieldsOr.join(" OR ")})`;
			}
		}

		this.#values.push(...values);

		return this;
	}

	async execute<T extends pg.QueryResultRow>() {
		const sql = this.#compareSql();

		return (await this.#pool.query<T>(sql, this.#values)).rows;
	}
}
