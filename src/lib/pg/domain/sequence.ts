import * as Types from "./types.js";
import { BaseSequence as Model } from "../model/index.js";

type BaseSequenceGeneric = string | number;

/**
 * @experimental
 *
 * A generic class for handling sequences, which can be used with models that extend the `BaseSequence` model.
 * This class provides methods to get and set sequence values, increment sequences, and restart sequences.
 */
export class BaseSequence<
	M extends Model = Model,
	BSG extends BaseSequenceGeneric = BaseSequenceGeneric,
> {
	#name;

	/**
	 * The model associated with this domain.
	 */
	model;

	/**
	 * Creates an instance of `BaseSequence`.
	 *
	 * @param data - The data containing the model.
	 *
	 * @throws {Error} If the provided model does not extend the `BaseSequence` model.
	 */
	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of PG.Model.BaseSequence");
		}

		this.model = data.model;

		this.#name = this.model.name;
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
	 * Retrieves the current value of the sequence.
	 *
	 * @returns The current value of the sequence or null if no value is set.
	 */
	async getCurrentValue(): Promise<BSG | null> {
		return this.model.getCurrentValue();
	}

	/**
	 * Retrieves the next value of the sequence.
	 *
	 * @returns The next value of the sequence.
	 */
	async getNextValue(): Promise<BSG> {
		return this.model.getNextValue();
	}

	/**
	 * Increments the sequence by a given value.
	 *
	 * @param value - The value to increment the sequence by.
	 *
	 * @returns
	 */
	async incrementBy(value: BSG): Promise<void> {
		return this.model.incrementBy(value);
	}

	/**
	 * Restarts the sequence with a given value.
	 *
	 * @param value - The value to restart the sequence with.
	 *
	 * @returns
	 */
	async restartWith(value: BSG): Promise<void> {
		return this.model.restartWith(value);
	}

	/**
	 * Sets the sequence to a specific value.
	 *
	 * @param value - The value to set the sequence to.
	 * @returns
	 */
	async setValue(value: BSG): Promise<void> {
		return this.model.setValue(value);
	}
}
