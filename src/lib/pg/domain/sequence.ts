import * as Types from "./types.js";
import { BaseSequenceModel } from "../model/index.js";

type BaseSequenceGeneric = string | number;

/**
 * @experimental
 */
export class BaseSequenceDomain<
	BSM extends BaseSequenceModel = BaseSequenceModel,
	BSG extends BaseSequenceGeneric = BaseSequenceGeneric,
> {
	#name;

	model;

	constructor(data: Types.TDomain<BSM>) {
		if (!(data.model instanceof BaseSequenceModel)) {
			throw new Error("You need pass extended of BaseSequenceDomain");
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
