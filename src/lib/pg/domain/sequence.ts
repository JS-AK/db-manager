import * as Types from "./types.js";
import { BaseSequence as Model } from "../model/index.js";

type BaseSequenceGeneric = string | number;

/**
 * @experimental
 */
export class BaseSequence<
	M extends Model = Model,
	BSG extends BaseSequenceGeneric = BaseSequenceGeneric,
> {
	#name;

	model;

	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of PG.Model.BaseSequence");
		}

		this.model = data.model;

		this.#name = this.model.name;
	}

	get name() {
		return this.#name;
	}

	async getCurrentValue(): Promise<BSG | null> {
		return this.model.getCurrentValue();
	}

	async getNextValue(): Promise<BSG> {
		return this.model.getNextValue();
	}

	async incrementBy(value: BSG): Promise<void> {
		return this.model.incrementBy(value);
	}

	async restartWith(value: BSG): Promise<void> {
		return this.model.restartWith(value);
	}

	async setValue(value: BSG): Promise<void> {
		return this.model.setValue(value);
	}
}
