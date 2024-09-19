import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import * as connection from "../connection.js";
import { QueryBuilder } from "../query-builder/index.js";
import { setLoggerAndExecutor } from "../helpers/index.js";

/**
 * @experimental
 */
export class BaseSequence {
	#isLoggerEnabled;
	#logger?: SharedTypes.TLogger;
	#executeSql;

	#initialArgs;

	pool: pg.Pool;
	name;

	constructor(
		data: { name: string; },
		dbCreds: Types.TDBCreds,
		options?: Types.TSOptions,
	) {
		this.pool = connection.getStandardPool(dbCreds);
		this.name = data.name;

		this.#initialArgs = { data, dbCreds, options };

		const { executeSql, isLoggerEnabled, logger } = setLoggerAndExecutor(this.pool, options);

		this.#executeSql = executeSql;
		this.#isLoggerEnabled = isLoggerEnabled;
		this.#logger = logger;
	}

	get executeSql() {
		return this.#executeSql;
	}

	/**
	 * Sets the client in the current class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns The current instance with the new connection client.
	 */
	setClientInCurrentClass(client: pg.Pool | pg.PoolClient | pg.Client): this {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return new this.constructor(
			{ ...this.#initialArgs.data },
			{ ...this.#initialArgs.dbCreds },
			{ ...this.#initialArgs.options, client },
		);
	}

	/**
	 * Sets the client in the base class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the base class with the new connection client.
	 */
	setClientInBaseClass(client: pg.Pool | pg.PoolClient | pg.Client): BaseSequence {
		return new BaseSequence(
			{ ...this.#initialArgs.data },
			{ ...this.#initialArgs.dbCreds },
			{ ...this.#initialArgs.options, client },
		);
	}

	async getCurrentValue<T extends string | number>(): Promise<T | null> {
		const query = `SELECT last_value FROM ${this.name}`;
		const { rows: [entity] } = await this.#executeSql<{ last_value: T; }>({ query });

		return entity ? entity.last_value : null;
	}

	async getNextValue<T extends string | number>(): Promise<T> {
		const query = `SELECT nextval('${this.name}')`;
		const { rows: [entity] } = await this.#executeSql<{ nextval: T; }>({ query });

		if (!entity) throw new Error("Could not get next value");

		return entity.nextval;
	}

	async setValue<T extends string | number>(value: T): Promise<void> {
		const query = `SELECT setval('${this.name}', $1)`;

		await this.#executeSql({ query, values: [value] });
	}

	async incrementBy<T extends string | number>(value: T): Promise<void> {
		const query = `SELECT setval('${this.name}', nextval('${this.name}') + $1)`;

		await this.#executeSql({ query, values: [value] });
	}

	async restartWith<T extends string | number>(value: T): Promise<void> {
		const query = `ALTER SEQUENCE ${this.name} RESTART WITH ${Number(value)}`;

		await this.#executeSql({ query });
	}

	queryBuilder(options?: {
		client?: pg.Pool | pg.PoolClient | pg.Client;
		name?: string;
	}) {
		const { client, name } = options || {};

		return new QueryBuilder(
			name ?? this.name,
			client ?? this.pool,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);
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
