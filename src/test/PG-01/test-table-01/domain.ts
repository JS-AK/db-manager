import { PG } from "../../../index.js";

import { Model, Types } from "./model/index.js";

export class Domain extends PG.BaseDomain<{
	Model: Model;
	CreateFields: Types.CreateFields;
	SearchFields: Types.SearchFields;
	TableFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {

	constructor(creds: PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}

	async createDefaultState(): Promise<void> {
		await Promise.all([1, 2, 3, 4, 5].map((e) => super.createOne({
			books: [`book ${e}`],
			description: `description ${e}`,
			meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
			number_key: e,
			number_range: `[${e}00,${++e}01)`,
			title: `title ${e}`,
		})));
	}

	async clearAll(): Promise<void> {
		await super.deleteAll();
	}

	async test(): Promise<boolean> {
		const res = await this.model.test();

		if (!res) return false;

		return res.test;
	}
}
