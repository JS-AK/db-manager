import * as DomainTypes from "../domain/types.js";
import * as Helpers from "../model/helpers/index.js";
import * as ModelTypes from "../model/types.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";

export class QueryHandler {
	#groupBy = "";
	#join: string[] = [];
	#mainHaving = "";
	#mainQuery = "";
	#mainWhere = "";
	#orderBy = "";
	#pagination = "";
	#returning = "";
	#tableNamePrepared;
	#tableNameRaw;
	#valuesOrder = 0;
	#values: unknown[] = [];

	constructor(options: {
		groupBy?: string;
		join?: string[];
		mainHaving?: string;
		mainQuery?: string;
		mainWhere?: string;
		orderBy?: string;
		pagination?: string;
		returning?: string;
		tableNamePrepared: string;
		tableNameRaw: string;
		values?: unknown[];
		valuesOrder?: number;
	}) {
		if (options.groupBy) this.#groupBy = options.groupBy;
		if (options.join) this.#join = options.join;
		if (options.mainHaving) this.#mainHaving = options.mainHaving;
		if (options.mainQuery) this.#mainQuery = options.mainQuery;
		if (options.mainWhere) this.#mainWhere = options.mainWhere;
		if (options.orderBy) this.#orderBy = options.orderBy;
		if (options.pagination) this.#pagination = options.pagination;
		if (options.returning) this.#returning = options.returning;
		if (options.values) this.#values = options.values;
		if (options.valuesOrder) this.#valuesOrder = options.valuesOrder;

		this.#tableNameRaw = options.tableNameRaw;
		this.#tableNamePrepared = options.tableNamePrepared;
	}

	get optionsToClone() {
		return {
			groupBy: this.#groupBy,
			join: [...this.#join],
			mainHaving: this.#mainHaving,
			mainQuery: this.#mainQuery,
			mainWhere: this.#mainWhere,
			orderBy: this.#orderBy,
			pagination: this.#pagination,
			returning: this.#returning,
			tableNamePrepared: this.#tableNamePrepared,
			tableNameRaw: this.#tableNameRaw,
			values: structuredClone(this.#values),
			valuesOrder: this.#valuesOrder,
		};
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
	}

	select(data: string[]) {
		this.#mainQuery = `SELECT ${data.join(", ")} FROM ${this.#tableNameRaw}`;
	}

	rawJoin(data: string) {
		this.#join.push(data);
	}

	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`RIGHT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableNamePrepared}.${data.initialField}`);
	}

	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`LEFT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableNamePrepared}.${data.initialField}`);
	}

	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`INNER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableNamePrepared}.${data.initialField}`);
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`FULL OUTER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#tableNamePrepared}.${data.initialField}`);
	}

	where(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		const { queryArray, queryOrArray, values } = Helpers.compareFields(
			data.params as ModelTypes.TSearchParams,
			data.paramsOr,
		);

		if (queryArray.length) {
			const comparedFields = queryArray.map((e: ModelTypes.TField) => {
				const operatorFunction = Helpers.operatorMappings.get(e.operator);

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

			if (!this.#mainWhere) {
				this.#mainWhere += `WHERE (${comparedFields})`;
			} else {
				this.#mainWhere += ` AND (${comparedFields})`;
			}
		}

		if (queryOrArray?.length) {
			const comparedFieldsOr = [];

			for (const row of queryOrArray) {
				const { query } = row;
				const comparedFields = query.map((e: ModelTypes.TField) => {
					const operatorFunction = Helpers.operatorMappings.get(e.operator);

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

				comparedFieldsOr.push(`(${comparedFields})`);
			}

			if (!this.#mainWhere) {
				this.#mainWhere += `WHERE (${comparedFieldsOr.join(" OR ")})`;
			} else {
				this.#mainWhere += ` AND (${comparedFieldsOr.join(" OR ")})`;
			}
		}

		this.#values.push(...values);
	}

	rawWhere(data: string) {
		if (!data) return;

		if (!this.#mainWhere) this.#mainWhere = "WHERE ";

		this.#mainWhere += data;
	}

	pagination(data: { limit: number; offset: number; }) {
		if (this.#pagination) throw new Error("pagination already defined");

		this.#pagination = `LIMIT $${++this.#valuesOrder} OFFSET $${++this.#valuesOrder}`;

		this.#values.push(data.limit);
		this.#values.push(data.offset);
	}

	orderBy(data: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]) {
		if (!this.#orderBy) this.#orderBy = "ORDER BY";

		this.#orderBy += ` ${data.map((o) => `${o.column} ${o.sorting}`).join(", ")}`;
	}

	groupBy(data: string[]) {
		if (!this.#groupBy) this.#groupBy = "GROUP BY";

		this.#groupBy += ` ${data.join(", ")}`;
	}

	having(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		const { queryArray, queryOrArray, values } = Helpers.compareFields(
			data.params as ModelTypes.TSearchParams,
			data.paramsOr,
		);

		if (queryArray.length) {
			const comparedFields = queryArray.map((e: ModelTypes.TField) => {
				const operatorFunction = Helpers.operatorMappings.get(e.operator);

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

			if (!this.#mainHaving) {
				this.#mainHaving += `HAVING (${comparedFields})`;
			} else {
				this.#mainHaving += ` AND (${comparedFields})`;
			}
		}

		if (queryOrArray?.length) {
			const comparedFieldsOr = [];

			for (const row of queryOrArray) {
				const { query } = row;
				const comparedFields = query.map((e: ModelTypes.TField) => {
					const operatorFunction = Helpers.operatorMappings.get(e.operator);

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

				comparedFieldsOr.push(`(${comparedFields})`);
			}

			if (!this.#mainHaving) {
				this.#mainHaving += `HAVING (${comparedFieldsOr.join(" OR ")})`;
			} else {
				this.#mainHaving += ` AND (${comparedFieldsOr.join(" OR ")})`;
			}
		}

		this.#values.push(...values);
	}

	rawHaving(data: string) {
		if (!data) return;

		if (!this.#mainHaving) this.#mainHaving = "HAVING ";

		this.#mainHaving += data;
	}

	returning(data: string[]) {
		this.#returning = `RETURNING ${data.join(", ")}`;
	}
}
