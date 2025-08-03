import * as ModelTypes from "../model/types.js";
import { BaseSequence as Model, TExecutor } from "../model/index.js";

import { BaseSequenceGeneric as SequenceGeneric } from "../domain/sequence.js";

/**
 * @experimental
 *
 * A generic class for handling sequences, which can be used with models that extend the `Sequence` model.
 * This class provides methods to get and set sequence values, increment sequences, and restart sequences.
 */
export class Sequence<SG extends SequenceGeneric = SequenceGeneric> {
	#name;

	#initialArgs;

	/**
	 * The model associated with this domain.
	 */
	#model;

	/**
	 * Initializes a new instance of the `Sequence` class.
	 *
	 * Wraps a {@link Model} instance based on the provided sequence schema definition,
	 * allowing structured access to sequence metadata and behavior.
	 *
	 * @param config - Configuration object for initializing the sequence.
	 * @param config.schema - Definition of the sequence structure, including:
	 *   - `name`: The name of the sequence.
	 * @param [config.client] - Optional custom executor (e.g., `pg.PoolClient`) to handle queries manually.
	 * @param [config.dbCreds] - Database connection credentials, used if `client` is not provided:
	 *   - `host`, `port`, `user`, `password`, `database`.
	 * @param [config.options] - Additional model options:
	 *   - Any other supported `Model`-level configuration excluding direct `client`.
	 *
	 * @throws {Error} If neither `client` nor `dbCreds` are provided, or if schema is invalid.
	 */
	constructor(config: {
		client?: TExecutor;
		dbCreds?: ModelTypes.TDBCreds;
		options?: ModelTypes.TSOptionsWithoutClient;
		schema: ModelTypes.TSequence;
	}) {
		this.#initialArgs = structuredClone(config);

		this.#model = new Model(config.schema, config.dbCreds, config.options);

		this.#name = this.#model.name;
	}

	/**
	 * Retrieves the name of the sequence.
	 *
	 * @returns The name of the sequence.
	 */
	get name() {
		return this.#name;
	}

	/**
	 * Gets the internal model object associated with this sequence.
	 *
	 * This provides access to the underlying model methods and fields.
	 *
	 * @returns The internal model object.
	 */
	get model() {
		return this.#model;
	}

	/**
	 * Sets the client in the current class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the current class with the updated client.
	 */
	setupClient(client: TExecutor): this {
		return new (this.constructor as new (config: {
			client?: TExecutor;
			dbCreds?: ModelTypes.TDBCreds;
			options?: ModelTypes.TMVOptionsWithoutClient;
			schema: ModelTypes.TSequence;
		}) => this)({
			client,
			dbCreds: this.#initialArgs.dbCreds,
			options: this.#initialArgs.options,
			schema: this.#initialArgs.schema,
		});
	}

	/**
	 * Retrieves the current value of the sequence.
	 *
	 * @returns The current value of the sequence or null if no value is set.
	 */
	async getCurrentValue(): Promise<SG | null> {
		return this.#model.getCurrentValue();
	}

	/**
	 * Retrieves the next value of the sequence.
	 *
	 * @returns The next value of the sequence.
	 */
	async getNextValue(): Promise<SG> {
		return this.#model.getNextValue();
	}

	/**
	 * Increments the sequence by a given value.
	 *
	 * @param value - The value to increment the sequence by.
	 *
	 * @returns
	 */
	async incrementBy(value: SG): Promise<void> {
		return this.#model.incrementBy(value);
	}

	/**
	 * Restarts the sequence with a given value.
	 *
	 * @param value - The value to restart the sequence with.
	 *
	 * @returns
	 */
	async restartWith(value: SG): Promise<void> {
		return this.#model.restartWith(value);
	}

	/**
	 * Sets the sequence to a specific value.
	 *
	 * @param value - The value to set the sequence to.
	 *
	 * @returns
	 */
	async setValue(value: SG): Promise<void> {
		return this.#model.setValue(value);
	}
}
