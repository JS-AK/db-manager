import * as Types from "./types.js";
import { BaseSequenceModel } from "../model/index.js";

/**
 * @experimental
 */
export class BaseSequenceDomain<T extends string | number, M extends BaseSequenceModel<T>> {
	#name;

	model;

	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof BaseSequenceModel)) {
			throw new Error("You need pass extended of BaseSequenceDomain");
		}

		this.model = data.model;

		this.#name = this.model.name;
	}

	get name() {
		return this.#name;
	}

	async getCurrentValue(): Promise<T | null> {
		return this.model.getCurrentValue();
	}

	async getNextValue(): Promise<T> {
		return this.model.getNextValue();
	}

	async incrementBy(value: T): Promise<void> {
		return this.model.incrementBy(value);
	}

	async restartWith(value: T): Promise<void> {
		return this.model.restartWith(value);
	}

	async setValue(value: T): Promise<void> {
		return this.model.setValue(value);
	}
}
