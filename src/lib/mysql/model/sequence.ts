import mysql from "mysql2/promise";

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
	 * The MySQL executor.
	 * - mysql.Pool
	 * - mysql.PoolClient
	 * - mysql.Client
	 */
	#executor: Types.TExecutor;

	name;

	constructor(
		data: Types.TSequence,
		dbCreds?: Types.TDBCreds,
		options?: Types.TSOptions,
	) {
		const { client } = options || {};

		if (client) {
			this.#executor = client;
		} else if (dbCreds) {
			this.#executor = connection.getStandardPool(dbCreds);
		} else {
			throw new Error("No client or dbCreds provided");
		}

		this.name = data.name;

		this.#initialArgs = { data, dbCreds, options };

		const { executeSql, isLoggerEnabled, logger } = setLoggerAndExecutor(this.#executor, options);

		this.#executeSql = executeSql;
		this.#isLoggerEnabled = isLoggerEnabled;
		this.#logger = logger;
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
	 * Gets the MySQL executor for the sequence.
	 *
	 * @returns The MySQL executor for the sequence.
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
			data: Types.TSequence,
			dbCreds?: Types.TDBCreds,
			options?: Types.TSOptions,
		) => this)(
			{ ...this.#initialArgs.data },
			this.#initialArgs.dbCreds ? { ...this.#initialArgs.dbCreds } : undefined,
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
			this.#initialArgs.dbCreds ? { ...this.#initialArgs.dbCreds } : undefined,
			{ ...this.#initialArgs.options, client },
		);
	}

	async getCurrentValue<T extends string | number>(): Promise<T | null> {
		const query = `SELECT last_value FROM ${this.name}`;
		const result = await this.#executeSql<{ last_value: T; } & mysql.RowDataPacket>({ query });

		return result[0][0] ? result[0][0].last_value : null;
	}

	async getNextValue<T extends string | number>(): Promise<T> {
		const query = `SELECT nextval('${this.name}')`;
		const result = await this.#executeSql<{ nextval: T; } & mysql.RowDataPacket>({ query });

		if (!result[0][0]) throw new Error("Could not get next value");

		return result[0][0].nextval;
	}

	async setValue<T extends string | number>(value: T): Promise<void> {
		const query = `SELECT setval('${this.name}', ?)`;

		await this.#executeSql({ query, values: [value] });
	}

	async incrementBy<T extends string | number>(value: T): Promise<void> {
		const query = `SELECT setval('${this.name}', nextval('${this.name}') + ?)`;

		await this.#executeSql({ query, values: [value] });
	}

	async restartWith<T extends string | number>(value: T): Promise<void> {
		const query = `ALTER SEQUENCE ${this.name} RESTART WITH ${Number(value)}`;

		await this.#executeSql({ query });
	}

	queryBuilder(options?: {
		client?: Types.TExecutor;
		isLoggerEnabled?: boolean;
		logger?: SharedTypes.TLogger;
		name?: string;
	}) {
		const { client, isLoggerEnabled, logger, name } = options || {};

		return new QueryBuilder(
			name ?? this.name,
			client ?? this.#executor,
			{
				isLoggerEnabled: isLoggerEnabled ?? this.#isLoggerEnabled,
				logger: logger ?? this.#logger,
			},
		);
	}

	// STATIC METHODS
	static getStandardPool(creds: Types.TDBCreds, poolName?: string): mysql.Pool {
		return connection.getStandardPool(creds, poolName);
	}

	static async removeStandardPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeStandardPool(creds, poolName);
	}

	static getTransactionPool(creds: Types.TDBCreds, poolName?: string): mysql.Pool {
		return connection.getTransactionPool(creds, poolName);
	}

	static async removeTransactionPool(creds: Types.TDBCreds, poolName?: string): Promise<void> {
		return connection.removeTransactionPool(creds, poolName);
	}
}
