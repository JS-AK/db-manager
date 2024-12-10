import * as Model from "../model/index.js";
import * as connection from "../connection.js";
import { BaseTable as BaseModelTable } from "../model/table.js";
import { QueryBuilderFactory } from "../query-builder/query-builder-factory.js";
import { TransactionManager } from "../transaction-manager/transaction-manager.js";

import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "../model/types.js";

type Model =
	| Model.BaseMaterializedView
	| Model.BaseModel
	| Model.BaseSequence
	| Model.BaseTable
	| Model.BaseView;

/**
 * RepositoryManager class.
 * It is a class for managing MYSQL repositories, query builder factory and transaction manager.
 *
 */
export class RepositoryManager<const T extends Record<string, { model: Model; }>> {
	#config;
	#logger;
	#queryBuilderFactory;
	#repository: T;
	#standardPool;
	#transactionPool;

	/**
	 * Constructs a new RepositoryManager instance.
	 *
	 * @param repository - Object containing property names which map to MYSQL.Domain instances.
	 * @param options - Additional configuration options.
	 * @param options.config - Database connection configuration options.
	 * @param options.logger - Logger to use for logging query execution details.
	 * @param [options.isLoggerEnabled] - If true, enables query execution logging for all
	 */
	constructor(
		repository: T,
		options: {
			config: Types.TDBCreds;
			logger: SharedTypes.TLogger;
			isLoggerEnabled?: boolean;
		},
	) {
		this.#config = options.config;
		this.#logger = options.logger;
		this.#standardPool = BaseModelTable.getStandardPool(this.#config);
		this.#transactionPool = BaseModelTable.getTransactionPool(this.#config);
		this.#repository = repository;
		this.#queryBuilderFactory = new QueryBuilderFactory(this.#standardPool, {
			isLoggerEnabled: options.isLoggerEnabled,
			logger: this.#logger,
		});

		if (options.isLoggerEnabled) {
			for (const r of Object.values(repository)) {
				if (r.model.isLoggerEnabled === false) {
					continue;
				}

				r.model.setLogger(this.#logger);
			}
		}
	}

	/**
	 * Provides access to the QueryBuilderFactory instance.
	 *
	 * @returns The QueryBuilderFactory instance used for creating QueryBuilder objects.
	 */
	get queryBuilderFactory() {
		return this.#queryBuilderFactory;
	}

	/**
	 * Provides access to the repository object.
	 *
	 * @returns The repository object containing the Domain instances.
	 */
	get repository() {
		return this.#repository;
	}

	/**
	 * Provides access to the standard pool.
	 *
	 * @returns The standard pool connection used for executing non-transactional queries.
	 */
	get standardPool() {
		return this.#standardPool;
	}

	/**
	 * Provides access to the transaction pool.
	 *
	 * @returns The transaction pool connection used for executing transactions.
	 */
	get transactionPool() {
		return this.#transactionPool;
	}

	/**
	 * Checks the connection to the database.
	 *
	 * @returns A promise that resolves to a boolean indicating whether the connection is successful.
	 */
	async #checkConnection() {
		try {
			await this.#standardPool.query("SELECT 1");

			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Something went wrong";

			this.#logger.error(message);

			return false;
		}
	}

	/**
	 * Initializes the RepositoryManager instance.
	 *
	 * This method checks the connection to the database and throws an error if the connection fails.
	 *
	 * @returns A promise that resolves when the connection is successful.
	 */
	async init() {
		const connected = await this.#checkConnection();

		if (!connected) throw new Error(`Failed to connect to MYSQL database ${this.#config.database} at ${this.#config.host}:${this.#config.port}`);
	}

	/**
	 * Shuts down the active connection for the repository manager.
	 *
	 * @returns A promise that resolves when the connection is closed.
	 */
	async shutdown() {
		await connection.shutdown();
	}

	/**
	 * Executes a function within a transaction.
	 *
	 * @param fn - The function to execute within the transaction.
	 * @param [options] - Configuration options for the transaction.
	 * @param [options.isolationLevel] - Optional isolation level for the transaction.
	 *
	 * @returns The result of the function.
	 *
	 * @throws {Error} If the transaction fails, it is rolled back and the error is rethrown.
	 */
	executeTransaction<R>(
		fn: Parameters<typeof TransactionManager.execute<R>>[0],
		options?: Omit<Parameters<typeof TransactionManager.execute<R>>[1], "pool">,
	) {
		return TransactionManager.execute(fn, {
			isolationLevel: options?.isolationLevel,
			pool: this.transactionPool,
		});
	}
}
