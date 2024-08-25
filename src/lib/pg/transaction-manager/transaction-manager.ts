import pg from "pg";

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
	#client: pg.PoolClient;
	#isolationLevel?: keyof typeof TransactionIsolationLevel;

	/**
	 * Creates an instance of TransactionManager.
	 *
	 * @param client - The PostgreSQL client to manage transactions.
	 * @param [isolationLevel] - Optional isolation level for the transaction.
	 *
	 * @throws {Error} If an invalid transaction isolation level is provided.
	 */
	constructor(
		client: pg.PoolClient,
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
	 * @param options.pool - The PostgreSQL connection pool.
	 * @param [options.isolationLevel] - Optional isolation level for the transaction.
	 *
	 * @returns The result of the function.
	 *
	 * @throws {Error} If the transaction fails, it is rolled back and the error is rethrown.
	 */
	static async execute<R>(
		fn: (client: pg.PoolClient) => Promise<R>,
		options: {
			pool: pg.Pool;
			isolationLevel?: keyof typeof TransactionIsolationLevel;
		},
	): Promise<R> {
		const client = await options.pool.connect();
		const manager = new TransactionManager(client, options.isolationLevel);

		try {
			await manager.#beginTransaction();
			const result = await fn(client);

			await manager.#commitTransaction();

			return result;
		} catch (error) {
			await manager.#rollbackTransaction();
			throw error;
		} finally {
			manager.#endConnection();
		}
	}
}
