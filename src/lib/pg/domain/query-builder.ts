import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";

type Operator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "$between" | "$in" | "$like" | "$ilike" | "$nbetween" | "$nlike" | "$nilike" | "$nin" | "$isNull" | "$isNotNull";

const operatorMappings: Map<Operator, (el: string, orderNumber: number) => [string, number]> = new Map([
	[
		"$between",
		(el: string, orderNumber: number) => [`(${el} BETWEEN $${orderNumber + 1} AND $${orderNumber + 2})`, orderNumber + 2],
	],
	[
		"$in",
		(el: string, orderNumber: number) => [`(${el} = ANY ($${orderNumber + 1}))`, orderNumber + 1],
	],
	[
		"$like",
		(el: string, orderNumber: number) => [`(${el} LIKE $${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$ilike",
		(el: string, orderNumber: number) => [`(${el} ILIKE $${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$nin",
		(el: string, orderNumber: number) => [`(NOT (${el} = ANY ($${orderNumber + 1})))`, orderNumber + 1],
	],
	[
		"$nbetween",
		(el: string, orderNumber: number) => [`(${el} NOT BETWEEN $${orderNumber + 1} AND $${orderNumber + 2})`, orderNumber + 2],
	],
	[
		"$nlike",
		(el: string, orderNumber: number) => [`(${el} NOT LIKE $${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$nilike",
		(el: string, orderNumber: number) => [`(${el} NOT ILIKE $${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$isNull",
		(el: string, orderNumber: number) => [`(${el} IS NULL)`, orderNumber],
	],
	[
		"$isNotNull",
		(el: string, orderNumber: number) => [`(${el} IS NOT NULL)`, orderNumber],
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
	#tableName: string;
	#values: unknown[] = [];

	#pool;

	constructor(tableName: string, pool: pg.Pool) {
		this.#mainFrom = `FROM ${tableName}\r\n`;
		this.#tableName = tableName;
		this.#valuesOrder = 0;

		this.#pool = pool;
	}

	#compareSql() {
		if (this.#mainWhere) this.#mainWhere += "\r\n";
		if (this.#mainHaving) this.#mainHaving += "\r\n";

		const join = this.#join.length
			? this.#join.join("\r\n") + "\r\n"
			: "";

		return `${this.#mainSelect}${this.#mainFrom}${join}${this.#mainWhere}${this.#groupBy}${this.#mainHaving}${this.#orderBy}${this.#pagination}`;
	}

	getSql() {
		return this.#compareSql();
	}

	select(arr: string[]) {
		this.#mainSelect = `SELECT ${arr.join(", ")}\r\n`;

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

	where(arr: { key: string; operator: Operator; }[], values: unknown[]) {
		if (!this.#mainWhere) this.#mainWhere += "WHERE ";
		else this.#mainWhere += " AND ";

		let end = 0;

		for (const e of arr) {
			const operatorFunction = operatorMappings.get(e.operator);

			if (operatorFunction) {
				const [text, orderNumber] = operatorFunction(e.key, this.#valuesOrder);

				this.#valuesOrder = orderNumber;
				this.#mainWhere += text;
			} else {
				this.#valuesOrder += 1;
				this.#mainWhere += `${e.key} ${e.operator} $${this.#valuesOrder}`;
			}

			end += 1;

			if (end !== arr.length) {
				this.#mainWhere += " AND ";
			}
		}

		this.#values.push(...values);

		return this;
	}

	whereOr(arrWithOr: Types.TArray2OrMore<{ key: string; operator: Operator; }[]>, values: unknown[]) {
		if (!this.#mainWhere) this.#mainWhere += "WHERE ";
		else this.#mainWhere += " AND (";

		let endWithOr = 0;

		for (const arr of arrWithOr) {
			let end = 0;

			this.#mainWhere += "(";

			for (const el of arr) {
				const operatorFunction = operatorMappings.get(el.operator);

				if (operatorFunction) {
					const [text, orderNumber] = operatorFunction(el.key, this.#valuesOrder);

					this.#valuesOrder = orderNumber;
					this.#mainWhere += text;
				} else {
					this.#valuesOrder += 1;
					this.#mainWhere += `${el.key} ${el.operator} $${this.#valuesOrder}`;
				}

				end += 1;
				if (end !== arr.length) {
					this.#mainWhere += " AND ";
				}
			}

			endWithOr += 1;
			if (endWithOr !== arrWithOr.length) {
				this.#mainWhere += ") OR ";
			} else {
				this.#mainWhere += ")";
			}
		}
		this.#mainWhere += ")";

		this.#values.push(...values);

		return this;
	}

	pagination(data: { limit: number; offset: number; }) {
		this.#pagination += `LIMIT ${data.limit} OFFSET ${data.offset}`;

		return this;
	}

	orderBy(data: { column: string; sorting: SharedTypes.TOrdering; }[]) {
		this.#orderBy += `ORDER BY ${data.map((o) => `${o.column} ${o.sorting}`).join(", ")}\r\n`;

		return this;
	}

	groupBy(data: string[]) {
		this.#groupBy += `GROUP BY ${data.join(", ")}\r\n`;

		return this;
	}

	having(arr: { key: string; operator: Operator; }[], values: unknown[]) {
		if (!this.#mainHaving) this.#mainHaving += "HAVING ";
		else this.#mainHaving += " AND ";

		let end = 0;

		for (const e of arr) {
			const operatorFunction = operatorMappings.get(e.operator);

			if (operatorFunction) {
				const [text, orderNumber] = operatorFunction(e.key, this.#valuesOrder);

				this.#valuesOrder = orderNumber;
				this.#mainHaving += text;
			} else {
				this.#valuesOrder += 1;
				this.#mainHaving += `${e.key} ${e.operator} $${this.#valuesOrder}`;
			}

			end += 1;

			if (end !== arr.length) {
				this.#mainHaving += " AND ";
			}
		}

		this.#values.push(...values);

		return this;
	}

	havingOr(arrWithOr: Types.TArray2OrMore<{ key: string; operator: Operator; }[]>, values: unknown[]) {
		if (!this.#mainHaving) this.#mainHaving += "HAVING ";
		else this.#mainHaving += " AND (";

		let endWithOr = 0;

		for (const arr of arrWithOr) {
			let end = 0;

			this.#mainHaving += "(";

			for (const el of arr) {
				const operatorFunction = operatorMappings.get(el.operator);

				if (operatorFunction) {
					const [text, orderNumber] = operatorFunction(el.key, this.#valuesOrder);

					this.#valuesOrder = orderNumber;
					this.#mainHaving += text;
				} else {
					this.#valuesOrder += 1;
					this.#mainHaving += `${el.key} ${el.operator} $${this.#valuesOrder}`;
				}

				end += 1;
				if (end !== arr.length) {
					this.#mainHaving += " AND ";
				}
			}

			endWithOr += 1;
			if (endWithOr !== arrWithOr.length) {
				this.#mainHaving += ") OR ";
			} else {
				this.#mainHaving += ")";
			}
		}
		this.#mainHaving += ")";

		this.#values.push(...values);

		return this;
	}

	async execute<T extends pg.QueryResultRow>() {
		const sql = this.#compareSql();

		return (await this.#pool.query<T>(sql, this.#values)).rows;
	}
}
