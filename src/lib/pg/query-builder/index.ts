import pg from "pg";

import * as DomainTypes from "../domain/types.js";
import * as Helpers from "../model/helpers/index.js";
import * as ModelTypes from "../model/types.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
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
	#mainQuery = "";
	#mainHaving = "";
	#mainWhere = "";
	#groupBy = "";
	#orderBy = "";
	#valuesOrder: number;
	#join: string[] = [];
	#pagination = "";
	#returning = "";
	#tableNameRaw;
	#tableName;
	#values: unknown[] = [];

	#client;

	constructor(tableName: string, client: pg.Pool | pg.PoolClient) {
		this.#tableNameRaw = tableName;

		const chunks = tableName.toLowerCase().split(" ").filter((e) => e && e !== "as");
		const as = chunks[1]?.trim();

		if (as) {
			this.#tableName = as;
		} else {
			this.#tableName = tableName;
		}
		this.#valuesOrder = 0;

		this.#client = client;
	}

	#compareSql() {
		let sql = "";

		if (this.#mainQuery) sql += this.#mainQuery;
		if (this.#join.length) sql += " " + this.#join.join(" ");
		if (this.#mainWhere) sql += " " + this.#mainWhere;
		if (this.#groupBy) sql += " " + this.#groupBy;
		if (this.#mainHaving) sql += " " + this.#mainHaving;
		if (this.#orderBy) sql += " " + this.#orderBy;
		if (this.#pagination) sql += " " + this.#pagination;
		if (this.#returning) sql += " " + this.#returning;

		return sql + ";";
	}

	compareQuery(): { query: string; values: unknown[]; } {
		return { query: this.#compareSql(), values: this.#values };
	}

	delete() {
		this.#mainQuery = `DELETE FROM ${this.#tableNameRaw}`;

		return this;
	}

	insert<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T | T[];
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		const v = [];
		const k = [];
		const headers = new Set<string>();

		let insertQuery = "";

		if (Array.isArray(options.params)) {
			const [example] = options.params;

			if (!example) throw new Error("Invalid parameters");

			const params = SharedHelpers.clearUndefinedFields(example);

			Object.keys(params).forEach((e) => headers.add(e));

			for (const pR of options.params) {
				const params = SharedHelpers.clearUndefinedFields(pR);
				const keys = Object.keys(params);

				if (!keys.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(pR).join(", ")}`);

				for (const key of keys) {
					if (!headers.has(key)) {
						throw new Error(`Invalid params, all fields are undefined - ${Object.keys(pR).join(", ")}`);
					}
				}

				v.push(...Object.values(params));

				if (options.updateColumn) {
					switch (options.updateColumn.type) {
						case "timestamp": {
							keys.push(`${options.updateColumn.title} = NOW()`);
							break;
						}
						case "unix_timestamp": {
							keys.push(`${options.updateColumn.title} = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))`);
							break;
						}

						default: {
							throw new Error("Invalid type: " + options.updateColumn.type);
						}
					}
				}

				k.push(keys);
			}

			const valuesOrder = this.#valuesOrder;

			let idx = valuesOrder;

			insertQuery += k.map((e) => e.map(() => "$" + (++idx))).join("),(");
		} else {
			const params = SharedHelpers.clearUndefinedFields(options.params);

			Object.keys(params).forEach((e) => { headers.add(e); k.push(e); });
			v.push(...Object.values(params));

			if (!headers.size) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(options.params).join(", ")}`);

			if (options.updateColumn) {
				switch (options.updateColumn.type) {
					case "timestamp": {
						k.push(`${options.updateColumn.title} = NOW()`);
						break;
					}

					case "unix_timestamp": {
						k.push(`${options.updateColumn.title} = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))`);
						break;
					}

					default: {
						throw new Error("Invalid type: " + options.updateColumn.type);
					}
				}
			}

			const valuesOrder = this.#valuesOrder;

			insertQuery += k.map((e, idx) => "$" + (idx + 1 + valuesOrder)).join(",");
		}

		this.#mainQuery = `INSERT INTO ${this.#tableNameRaw}(${Array.from(headers).join(",")}) VALUES(${insertQuery})`;

		if (options.onConflict) this.#mainQuery += ` ${options.onConflict}`;

		this.#values.push(...v);
		this.#valuesOrder += v.length;

		return this;
	}

	update<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T;
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		const params = SharedHelpers.clearUndefinedFields(options.params);
		const k = Object.keys(params);
		const v = Object.values(params);

		if (!k.length) throw new Error(`Invalid params, all fields are undefined - ${Object.keys(options.params).join(", ")}`);

		const valuesOrder = this.#valuesOrder;
		let updateQuery = k.map((e: string, idx: number) => `${e} = $${idx + 1 + valuesOrder}`).join(",");

		if (options.updateColumn) {
			switch (options.updateColumn.type) {
				case "timestamp": {
					updateQuery += `, ${options.updateColumn.title} = NOW()`;
					break;
				}
				case "unix_timestamp": {
					updateQuery += `, ${options.updateColumn.title} = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))`;
					break;
				}

				default: {
					throw new Error("Invalid type: " + options.updateColumn.type);
				}
			}
		}

		this.#mainQuery = `UPDATE ${this.#tableNameRaw} SET ${updateQuery}`;

		if (options.onConflict) this.#mainQuery += ` ${options.onConflict}`;

		this.#values.push(...v);
		this.#valuesOrder += v.length;

		return this;
	}

	select(data: string[]) {
		this.#mainQuery = `SELECT ${data.join(", ")} FROM ${this.#tableNameRaw}`;

		return this;
	}

	rawJoin(data: string) {
		this.#join.push(data);

		return this;
	}

	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`RIGHT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`LEFT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`INNER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`FULL OUTER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableName}.${data.initialField}`);

		return this;
	}

	where(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		const { fields, fieldsOr, nullFields, values } = Helpers.compareFields(
			data.params as ModelTypes.TSearchParams,
			data.paramsOr,
		);

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

	rawWhere(data: string) {
		if (!data) return this;

		if (!this.#mainWhere) this.#mainWhere += "WHERE ";

		this.#mainWhere += data;

		return this;
	}

	pagination(data: { limit: number; offset: number; }) {
		this.#pagination += `LIMIT $${++this.#valuesOrder} OFFSET $${++this.#valuesOrder}`;

		this.#values.push(data.limit);
		this.#values.push(data.offset);

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
		const { fields, fieldsOr, nullFields, values } = Helpers.compareFields(
			data.params as ModelTypes.TSearchParams,
			data.paramsOr,
		);

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

	returning(data: string[]) {
		this.#returning += `RETURNING ${data.join(", ")}`;

		return this;
	}

	async execute<T extends pg.QueryResultRow>() {
		const sql = this.compareQuery();

		return (await this.#client.query<T>(sql.query, sql.values)).rows;
	}
}
