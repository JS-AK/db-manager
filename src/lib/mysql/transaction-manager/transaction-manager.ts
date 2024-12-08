import mysql from "mysql2/promise";

import * as SharedTypes from "../../../shared-types/index.js";

/**
 * Enumeration of valid transaction isolation levels.
 */
const TransactionIsolationLevel = Object.freeze({
	"READ COMMITTED": "READ COMMITTED",
	"READ UNCOMMITTED": "READ UNCOMMITTED",
	"REPEATABLE READ": "REPEATABLE READ",
	SERIALIZABLE: "SERIALIZABLE",
});

/**
 * @experimental
 */
export class TransactionManager {
	#client: mysql.PoolConnection;
	#isolationLevel?: keyof typeof TransactionIsolationLevel;

	/**
	 * Creates an instance of TransactionManager.
	 *
	 * @param client - The MySQL client to manage transactions.
	 * @param [isolationLevel] - Optional isolation level for the transaction.
	 *
	 * @throws {Error} If an invalid transaction isolation level is provided.
	 */
	constructor(
		client: mysql.PoolConnection,
		isolationLevel?: keyof typeof TransactionIsolationLevel,
	) {
		this.#client = client;
		this.#isolationLevel = isolationLevel;

		if (isolationLevel
			&& !TransactionIsolationLevel[isolationLevel]
		) {
			throw new Error("Invalid transaction isolation level provided.");
		}
	}

	/**
	 * Begins a transaction and sets the isolation level if specified.
	 */
	async #beginTransaction(): Promise<void> {
		await this.#client.query("BEGIN;");

		if (this.#isolationLevel) {
			await this.#client.query(`SET TRANSACTION ISOLATION LEVEL ${this.#isolationLevel};`);
		}
	}

	/**
	 * Commits the current transaction.
	 */
	async #commitTransaction(): Promise<void> {
		await this.#client.query("COMMIT;");
	}

	/**
	 * Rolls back the current transaction.
	 */
	async #rollbackTransaction(): Promise<void> {
		await this.#client.query("ROLLBACK;");
	}

	/**
	 * Releases the database client back to the pool.
	 */
	#endConnection(): void {
		this.#client.release();
	}

	/**
	 * Executes a function within a transaction.
	 *
	 * @param fn - The function to execute within the transaction.
	 * @param options - Configuration options for the transaction.
	 * @param [options.isLoggerEnabled] - Optional flag to enable logging.
	 * @param [options.isolationLevel] - Optional isolation level for the transaction.
	 * @param [options.logger] - Optional logger function.
	 * @param options.pool - The MySQL connection pool.
	 * @param [options.transactionId] - Optional transaction ID.
	 * @param [options.timeToRollback] - Optional time to wait before rolling back the transaction in milliseconds.
	 *
	 * @returns The result of the function.
	 *
	 * @throws {Error} If the transaction fails, it is rolled back and the error is rethrown.
	 */
	static async execute<R>(
		fn: (client: mysql.PoolConnection) => Promise<R>,
		options: {
			isLoggerEnabled?: true;
			isolationLevel?: keyof typeof TransactionIsolationLevel;
			logger?: SharedTypes.TLogger;
			pool: mysql.Pool;
			transactionId?: string;
			timeToRollback?: number;
		},
	): Promise<R> {
		const client = await options.pool.getConnection();
		const manager = new TransactionManager(client, options.isolationLevel);

		if (options.isLoggerEnabled) {
			const start = performance.now();

			const { logger } = options || {};

			// eslint-disable-next-line no-console
			const resultLogger = logger || { error: console.error, info: console.log };

			const transactionId = options.transactionId || "::transactionId is not defined::";

			let isTransactionFailed = false;

			try {
				await manager.#beginTransaction();

				if (options.timeToRollback) {
					let timeout: NodeJS.Timeout | null = null;

					const result = await Promise.race([
						fn(client),
						new Promise((_, reject) => {
							timeout = setTimeout(
								() => reject(new Error(`Transaction (${options.transactionId || "::transactionId is not defined::"}) timed out`)),
								options.timeToRollback,
							);

							return timeout;
						}),
					]) as R;

					timeout && clearTimeout(timeout);

					await manager.#commitTransaction();

					return result;
				} else {
					const result = await fn(client);

					await manager.#commitTransaction();

					return result;
				}
			} catch (error) {
				isTransactionFailed = true;

				await manager.#rollbackTransaction();

				throw error;
			} finally {
				manager.#endConnection();

				const execTime = Math.round(performance.now() - start);

				if (!isTransactionFailed) {
					resultLogger.info(`Transaction (${transactionId}) executed successfully in ${execTime} ms.`);
				} else {
					resultLogger.error(`Transaction (${transactionId}) failed in ${execTime} ms.`);
				}
			}
		} else {
			try {
				await manager.#beginTransaction();

				if (options.timeToRollback) {
					let timeout: NodeJS.Timeout | null = null;

					const result = await Promise.race([
						fn(client),
						new Promise((_, reject) => {
							timeout = setTimeout(
								() => reject(new Error(`Transaction (${options.transactionId || "::transactionId is not defined::"}) timed out`)),
								options.timeToRollback,
							);

							return timeout;
						}),
					]) as R;

					timeout && clearTimeout(timeout);

					await manager.#commitTransaction();

					return result;
				} else {
					const result = await fn(client);

					await manager.#commitTransaction();

					return result;
				}
			} catch (error) {
				await manager.#rollbackTransaction();
				throw error;
			} finally {
				manager.#endConnection();
			}
		}
	}
}
