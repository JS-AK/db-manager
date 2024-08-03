import pg from "pg";

import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";

/**
 * @experimental
 */
export class BaseSequence {
	pool: pg.Pool;
	name;

	constructor(
		data: { name: string; },
		dbCreds: Types.TDBCreds,
	) {
		this.pool = connection.getStandardPool(dbCreds);
		this.name = data.name;
	}

	async getCurrentValue<T extends string | number>(): Promise<T | null> {
		const query = `SELECT last_value FROM ${this.name}`;
		const { rows: [result] } = await this.pool.query<{ last_value: T; }>(query);

		return result ? result.last_value : null;
	}

	async getNextValue<T extends string | number>(): Promise<T> {
		const query = `SELECT nextval('${this.name}')`;
		const { rows: [result] } = await this.pool.query<{ nextval: T; }>(query);

		if (!result) throw new Error("Could not get next value");

		return result.nextval;
	}

	async setValue<T extends string | number>(value: T): Promise<void> {
		const query = `SELECT setval('${this.name}', $1)`;

		await this.pool.query(query, [value]);
	}

	async incrementBy<T extends string | number>(value: T): Promise<void> {
		const query = `SELECT setval('${this.name}', nextval('${this.name}') + $1)`;

		await this.pool.query(query, [value]);
	}

	async restartWith<T extends string | number>(value: T): Promise<void> {
		const query = `ALTER SEQUENCE ${this.name} RESTART WITH ${Number(value)}`;

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
