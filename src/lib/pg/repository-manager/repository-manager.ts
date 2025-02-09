import crypto from "node:crypto";

import * as Model from "../model/index.js";
import * as connection from "../connection.js";
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
 * It is a class for managing PG repositories, query builder factory and transaction manager.
 *
 */
export class RepositoryManager<const T extends Record<string, { model: Model; }>> {
	#token;

	#config;
	#isDisableSharedPool;
	#isUseSharedPool;
	#logger;
	#queryBuilderFactory;
	#repository: T;
	#standardPool;
	#transactionPool;

	/**
	 * Constructs a new RepositoryManager instance.
	 *
	 * @param repository - Object containing property names which map to PG.Domain instances.
	 * @param options - Additional configuration options.
	 * @param options.config - Database connection configuration options.
	 * @param options.logger - Logger to use for logging query execution details.
	 * @param [options.isDisableSharedPool] - If true, ends use of a shared db-manager PG pool (default: false).
	 * @param [options.isLoggerEnabled] - If true, enables query execution logging (default: false).
	 * @param [options.isUseSharedPool] - If true, uses a shared db-manager PG pool (default: true).
	 */
	constructor(
		repository: T,
		options: {
			config: Types.TDBCreds;
			logger: SharedTypes.TLogger;
			isLoggerEnabled?: boolean;
			isUseSharedPool?: boolean;
			isDisableSharedPool?: boolean;
		},
	) {
		const {
			isDisableSharedPool = false,
			isLoggerEnabled = false,
			isUseSharedPool = true,
		} = options;

		if (isUseSharedPool && isDisableSharedPool) {
			throw new Error("isUseSharedPool and isDisableSharedPool cannot both be true");
		}

		this.#token = isUseSharedPool ? "shared" : crypto.randomUUID();

		this.#config = options.config;
		this.#isDisableSharedPool = isDisableSharedPool;
		this.#isUseSharedPool = isUseSharedPool;
		this.#logger = options.logger;
		this.#standardPool = connection.getStandardPool(this.#config, this.#token);
		this.#transactionPool = connection.getTransactionPool(this.#config, this.#token);
		this.#repository = repository;
		this.#queryBuilderFactory = new QueryBuilderFactory(this.#standardPool, {
			isLoggerEnabled,
			logger: this.#logger,
		});

		this.#setupErrorHandling();

		if (isLoggerEnabled) {
			for (const r of Object.values(repository)) {
				if (r.model.isLoggerEnabled === false) {
					continue;
				}

				r.model.setLogger(this.#logger);
			}
		}

		if (!isUseSharedPool) {
			for (const r of Object.values(repository)) {
				r.model.setExecutor(this.#standardPool);
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
	 * Sets up error handling for the standard and transaction pools.
	 */
	#setupErrorHandling() {
		const handleError = (error: Error) => this.#logger.error(error.message);

		const setupPoolErrorHandling = (pool: ReturnType<typeof connection.getStandardPool>) => {
			pool.on("error", handleError);
			pool.on("connect", (client) => { client.on("error", handleError); });
		};

		setupPoolErrorHandling(this.standardPool);
		setupPoolErrorHandling(this.transactionPool);
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
		if (this.#isDisableSharedPool) {
			await connection.shutdown({ poolName: "shared" });
		}

		const connected = await this.#checkConnection();

		if (!connected) {
			throw new Error(`Failed to connect to PG database ${this.#config.database} at ${this.#config.host}:${this.#config.port}`);
		}
	}

	/**
	 * Shuts down the active connection for the repository manager.
	 *
	 * @returns A promise that resolves when the connection is closed.
	 */
	async shutdown() {
		if (this.#isUseSharedPool) {
			return;
		}

		await connection.shutdown({ poolName: this.#token });
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
