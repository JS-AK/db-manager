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
	#isLoggerEnabled: boolean | undefined;
	#logger?: SharedTypes.TLogger;
	#executeSql;

	#initialArgs;

	/**
	 * The PostgreSQL executor.
	 * - pg.Pool
	 * - pg.PoolClient
	 * - pg.Client
	 */
	#executor: Types.TExecutor;

	name;

	constructor(
		data: { name: string; },
		dbCreds: Types.TDBCreds,
		options?: Types.TSOptions,
	) {
		this.#executor = connection.getStandardPool(dbCreds);
		this.name = data.name;

		this.#initialArgs = { data, dbCreds, options };

		const { isLoggerEnabled, logger } = options || {};

		const preparedOptions = setLoggerAndExecutor(
			this.#executor,
			{ isLoggerEnabled, logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Gets the database client for the sequence.
	 *
	 * @returns The database client for the sequence.
	 */
	get pool() {
		return this.#executor;
	}

	/**
	 * Gets the PostgreSQL executor for the sequence.
	 *
	 * @returns The PostgreSQL executor for the sequence.
	 */
	get executor() {
		return this.#executor;
	}

	/**
	 * Sets the logger for the sequence.
	 *
	 * @param logger - The logger to use for the sequence.
	 */
	setLogger(logger: SharedTypes.TLogger) {
		const preparedOptions = setLoggerAndExecutor(
			this.#executor,
			{ isLoggerEnabled: true, logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
	}

	/**
	 * Sets the executor for the sequence.
	 *
	 * @param executor - The executor to use for the sequence.
	 */
	setExecutor(executor: Types.TExecutor) {
		const preparedOptions = setLoggerAndExecutor(
			executor,
			{ isLoggerEnabled: this.#isLoggerEnabled, logger: this.#logger },
		);

		this.#executeSql = preparedOptions.executeSql;
		this.#isLoggerEnabled = preparedOptions.isLoggerEnabled;
		this.#logger = preparedOptions.logger;
		this.#executor = executor;
	}

	get isLoggerEnabled(): boolean | undefined {
		return this.#isLoggerEnabled;
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
	setClientInCurrentClass(client: Types.TExecutor): this {
		return new (this.constructor as new (
			data: { name: string; },
			dbCreds: Types.TDBCreds,
			options?: Types.TSOptions,
		) => this)(
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
	setClientInBaseClass(client: Types.TExecutor): BaseSequence {
		return new BaseSequence(
			{ ...this.#initialArgs.data },
			{ ...this.#initialArgs.dbCreds },
			{ ...this.#initialArgs.options, client },
		);
	}

	async getCurrentValue<T extends string | number>(): Promise<T | null> {
		const query = `SELECT last_value FROM ${this.name}`;
		const { rows } = await this.#executeSql<{ last_value: T; }>({ query });

		return rows[0] ? rows[0].last_value : null;
	}

	async getNextValue<T extends string | number>(): Promise<T> {
		const query = `SELECT nextval('${this.name}')`;
		const { rows } = await this.#executeSql<{ nextval: T; }>({ query });

		if (!rows[0]) throw new Error("Could not get next value");

		return rows[0].nextval;
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
		client?: Types.TExecutor;
		name?: string;
	}) {
		const { client, name } = options || {};

		return new QueryBuilder(
			name ?? this.name,
			client ?? this.#executor,
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
