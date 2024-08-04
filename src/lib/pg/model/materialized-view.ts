import pg from "pg";

import * as Helpers from "./helpers/index.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import queries from "./queries.js";

/**
 * @experimental
 */
export class BaseMaterializedView {
	#sortingOrders = new Set(["ASC", "DESC"]);
	#coreFieldsSet;

	pool: pg.Pool;
	name;
	coreFields;

	constructor(
		data: { additionalSortingFields?: string[]; coreFields: string[]; name: string; },
		dbCreds: Types.TDBCreds,
	) {
		this.pool = connection.getStandardPool(dbCreds);
		this.name = data.name;
		this.coreFields = data.coreFields;

		this.#coreFieldsSet = new Set([
			...this.coreFields,
			...(data.additionalSortingFields || []),
		] as const);
	}

	compareFields = Helpers.compareFields;
	getFieldsToSearch = Helpers.getFieldsToSearch;

	compareQuery = {
		getArrByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected = ["*"],
			pagination?: SharedTypes.TPagination,
			order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
		): { query: string; values: unknown[]; } => {
			if (order?.length) {
				for (const o of order) {
					if (!this.#coreFieldsSet.has(o.orderBy)) {
						const allowedFields = Array.from(this.#coreFieldsSet).join(", ");

						throw new Error(`Invalid orderBy: ${o.orderBy}. Allowed fields are: ${allowedFields}`);
					}

					if (!this.#sortingOrders.has(o.ordering)) { throw new Error("Invalid ordering"); }
				}
			}

			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, pagination, order);

			return {
				query: queries.getByParams(this.name, selectedFields, searchFields, orderByFields, paginationFields),
				values,
			};
		},
		getCountByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		): { query: string; values: unknown[]; } => {
			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { searchFields } = this.getFieldsToSearch({ queryArray, queryOrArray });

			return {
				query: queries.getCountByParams(this.name, searchFields),
				values,
			};
		},
		getOneByParams: (
			{ $and = {}, $or }: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
			selected = ["*"],
		): { query: string; values: unknown[]; } => {
			if (!selected.length) selected.push("*");

			const { queryArray, queryOrArray, values } = this.compareFields($and, $or);
			const { orderByFields, paginationFields, searchFields, selectedFields } = this.getFieldsToSearch({ queryArray, queryOrArray }, selected, { limit: 1, offset: 0 });

			return {
				query: queries.getByParams(
					this.name,
					selectedFields,
					searchFields,
					orderByFields,
					paginationFields,
				),
				values,
			};
		},
	};

	async getArrByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		order?: { orderBy: string; ordering: SharedTypes.TOrdering; }[],
	) {
		const sql = this.compareQuery.getArrByParams(params, selected, pagination, order);
		const { rows } = await this.pool.query(sql.query, sql.values);

		return rows;
	}

	async getCountByParams(params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; }) {
		const sql = this.compareQuery.getCountByParams(params);
		const { rows: [entity] } = await this.pool.query<{ count: string; }>(sql.query, sql.values);

		return Number(entity?.count) || 0;
	}

	async getOneByParams(
		params: { $and: Types.TSearchParams; $or?: Types.TSearchParams[]; },
		selected = ["*"],
	) {
		const sql = this.compareQuery.getOneByParams(params, selected);
		const { rows: [entity] } = await this.pool.query(sql.query, sql.values);

		return entity;
	}

	async refresh(concurrently = false): Promise<void> {
		const query = `REFRESH MATERIALIZED VIEW ${concurrently ? "CONCURRENTLY" : ""} ${this.name}`;

		await this.pool.query(query);
	}

	queryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient;
		name?: string;
	}) {
		const { client, name } = options || {};

		return new QueryBuilder(name || this.name, client || this.pool);
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
}
