import * as DomainTypes from "../domain/types.js";
import * as Helpers from "../model/helpers/index.js";
import * as ModelTypes from "../model/types.js";
import * as SharedHelpers from "../../../shared-helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";

export class QueryHandler {
	#groupBy = "";
	#join: string[] = [];
	#subqueryName = "";
	#mainHaving = "";
	#mainQuery = "";
	#mainWhere = "";
	#orderBy = "";
	#pagination = "";
	#returning = "";
	#for = "";
	#dataSourcePrepared;
	#dataSourceRaw;
	#valuesOrder = 0;
	#values: unknown[] = [];
	#with = "";

	isSubquery = false;

	constructor(options: {
		groupBy?: string;
		join?: string[];
		isSubquery?: boolean;
		mainHaving?: string;
		mainQuery?: string;
		mainWhere?: string;
		orderBy?: string;
		pagination?: string;
		returning?: string;
		dataSourcePrepared: string;
		dataSourceRaw: string;
		values?: unknown[];
		valuesOrder?: number;
		with?: string;
	}) {
		if (options.groupBy) this.#groupBy = options.groupBy;
		if (options.join) this.#join = options.join;
		if (options.isSubquery) this.isSubquery = options.isSubquery;
		if (options.mainHaving) this.#mainHaving = options.mainHaving;
		if (options.mainQuery) this.#mainQuery = options.mainQuery;
		if (options.mainWhere) this.#mainWhere = options.mainWhere;
		if (options.orderBy) this.#orderBy = options.orderBy;
		if (options.pagination) this.#pagination = options.pagination;
		if (options.returning) this.#returning = options.returning;
		if (options.values) this.#values = options.values;
		if (options.valuesOrder) this.#valuesOrder = options.valuesOrder;
		if (options.with) this.#with = options.with;

		this.#dataSourceRaw = options.dataSourceRaw;
		this.#dataSourcePrepared = options.dataSourcePrepared;
	}

	get optionsToClone() {
		return {
			dataSourcePrepared: this.#dataSourcePrepared,
			dataSourceRaw: this.#dataSourceRaw,
			groupBy: this.#groupBy,
			join: [...this.#join],
			mainHaving: this.#mainHaving,
			mainQuery: this.#mainQuery,
			mainWhere: this.#mainWhere,
			orderBy: this.#orderBy,
			pagination: this.#pagination,
			returning: this.#returning,
			values: structuredClone(this.#values),
			valuesOrder: this.#valuesOrder,
			with: this.#with,
		};
	}

	#compareSql(): string {
		const query = (
			(this.#with ? this.#with + " " : "")
			+ (this.#mainQuery ?? "")
			+ (this.#join.length ? " " + this.#join.join(" ") : "")
			+ (this.#mainWhere ? " " + this.#mainWhere : "")
			+ (this.#groupBy ? " " + this.#groupBy : "")
			+ (this.#mainHaving ? " " + this.#mainHaving : "")
			+ (this.#orderBy ? " " + this.#orderBy : "")
			+ (this.#pagination ? " " + this.#pagination : "")
			+ (this.#returning ? " " + this.#returning : "")
			+ (this.#for ? " " + this.#for : "")
		);

		return this.isSubquery
			? `(${query})${this.#subqueryName ? ` AS ${this.#subqueryName}` : ""}`
			: query + ";";
	}

	/* #replaceDollarSign(text: string) {
		const regex = /\$\?/g;

		const initialCounter = this.#valuesOrder;
		const replacedText = text.replace(regex, () => `$${++this.#valuesOrder}`);
		const growth = this.#valuesOrder - initialCounter;

		return { growth, text: replacedText };
	} */

	#replaceDollarSign(text: string) {
		const regex = /\$(\d+)/g;
		const initialCounter = this.#valuesOrder;

		const matches = text.match(regex);

		if (matches) {
			const uniqueNumbers = [...new Set(matches.map((match) => Number(match.slice(1))))].sort((a, b) => a - b);

			const minNumber = Math.min(...uniqueNumbers);
			const maxNumber = Math.max(...uniqueNumbers);

			if (minNumber !== 1 || maxNumber !== uniqueNumbers.length) {
				throw new Error("Values are not sequential starting from $1");
			}

			const replacedText = text.replace(regex, (_, p1) => {
				const number = Number(p1);

				return `$${number + this.#valuesOrder}`;
			});

			this.#valuesOrder += uniqueNumbers.length;
			const growth = this.#valuesOrder - initialCounter;

			return { growth, text: replacedText };
		}

		return { growth: 0, text };
	}

	#processDataWithValues(data: string, values: unknown[]): string {
		const { growth, text } = this.#replaceDollarSign(data);

		if (growth !== values.length) {
			throw new Error(`${text} - Invalid values: ${JSON.stringify(values)}`);
		}

		this.#values.push(...values);

		return text;
	}

	compareQuery(): { query: string; values: unknown[]; } {
		return { query: this.#compareSql(), values: this.#values };
	}

	rawFor(data: string, values?: unknown[]) {
		if (!data) return;

		if (!this.#for) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 3) !== "for") {
				this.#for = "FOR ";
			}
		}

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#for += ` ${dataPrepared}`;
	}

	delete() {
		this.#mainQuery = `DELETE FROM ${this.#dataSourceRaw}`;
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

			insertQuery += k.map((_, idx) => "$" + (idx + 1 + valuesOrder)).join(",");
		}

		this.#mainQuery = `INSERT INTO ${this.#dataSourceRaw}(${Array.from(headers).join(",")}) VALUES(${insertQuery})`;

		if (options.onConflict) this.#mainQuery += ` ${options.onConflict}`;

		this.#values.push(...v);
		this.#valuesOrder += v.length;
	}

	rawInsert(data: string, values?: unknown[]) {
		if (!data) return;

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#mainQuery = `INSERT INTO ${this.#dataSourceRaw} ${dataPrepared}`;
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

		this.#mainQuery = `UPDATE ${this.#dataSourceRaw} SET ${updateQuery}`;

		if (options.onConflict) this.#mainQuery += ` ${options.onConflict}`;

		this.#values.push(...v);
		this.#valuesOrder += v.length;
	}

	rawUpdate(data: string, values?: unknown[]): void {
		if (!data) return;

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		if (!this.#mainQuery) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 6) !== "UPDATE") {
				this.#mainQuery = `UPDATE ${this.#dataSourceRaw} SET`;
			}

			this.#mainQuery += ` ${dataPrepared}`;

			return;
		}

		this.#mainQuery += `, ${dataPrepared}`;

		return;
	}

	select(data: string[]) {
		const fromClause = this.#dataSourceRaw
			? ` FROM ${this.#dataSourceRaw}`
			: "";

		this.#mainQuery = `SELECT ${data.join(", ")}${fromClause}`;
	}

	from(data: string, values?: unknown[]) {
		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#dataSourceRaw = dataPrepared;

		const [firstClause, fromClause] = this.#mainQuery.split(" FROM ");

		if (fromClause) {
			this.#mainQuery = `${firstClause} FROM ${this.#dataSourceRaw}`;
		} else {
			this.#mainQuery = `${this.#mainQuery} FROM ${this.#dataSourceRaw}`;
		}

		const chunks = dataPrepared
			.toLowerCase()
			.split(" ")
			.filter((e) => e && e !== "as");

		const as = chunks[1]?.trim();

		if (as) {
			this.#dataSourcePrepared = as;
		} else {
			this.#dataSourcePrepared = dataPrepared;
		}
	}

	rawJoin(data: string, values?: unknown[]) {
		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#join.push(dataPrepared);
	}

	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`RIGHT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`LEFT JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`INNER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		const targetTableName = data.targetTableName + (data.targetTableNameAs ? ` AS ${data.targetTableNameAs}` : "");

		this.#join.push(`FULL OUTER JOIN ${targetTableName} ON ${data.targetTableNameAs || data.targetTableName}.${data.targetField} = ${data.initialTableName || this.#dataSourcePrepared}.${data.initialField}`);
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

	with(data: { name: string; query: string; }, values?: unknown[]) {
		const queryPrepared = values?.length
			? this.#processDataWithValues(data.query, values)
			: data.query;

		const text = `${data.name} AS (${queryPrepared})`;

		if (!this.#with) {
			this.#with = `WITH ${text}`;
		} else {
			this.#with += `, ${text}`;
		}
	}

	rawWhere(data: string, values?: unknown[]) {
		if (!data) return;

		if (!this.#mainWhere) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 5) !== "where") {
				this.#mainWhere = "WHERE";
			}
		}

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#mainWhere += ` ${dataPrepared}`;
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

	rawHaving(data: string, values?: unknown[]) {
		if (!data) return;

		if (!this.#mainHaving) {
			const dataLowerCased = data.toLowerCase();

			if (dataLowerCased.slice(0, 6) !== "having") {
				this.#mainHaving = "HAVING";
			}
		}

		const dataPrepared = values?.length
			? this.#processDataWithValues(data, values)
			: data;

		this.#mainHaving += ` ${dataPrepared}`;
	}

	returning(data: string[]) {
		this.#returning = `RETURNING ${data.join(", ")}`;
	}

	toSubquery(data?: string) {
		this.isSubquery = true;

		if (data) {
			this.#subqueryName = data;
		}
	}
}
