import { PG } from "../../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";
import { queries } from "./queries.js";

export class Domain extends PG.Domain.BaseTable<PG.Model.BaseTable, {
	CreateFields: Types.CreateFields;
	SearchFields: Types.SearchFields;
	CoreFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {
	async createDefaultState(): Promise<void> {
		await Promise.all([1, 2, 3, 4, 5].map((e) => super.createOne({
			books: [`book 0${e}`, `book 1${e}`, `book 2${e}`, `book 3${e}`, `book 4${e}`],
			checklist: [
				{ isDone: false, title: `checklist 0${e}` },
				{ isDone: false, title: `checklist 1${e}` },
				{ isDone: false, title: `checklist 2${e}` },
			],
			description: `description ${e}`,
			meta: { firstName: `firstName ${e}`, lastName: `lastName ${e}` },
			number_key: e,
			number_range: `[${e}00,${++e}01)`,
			title: `title ${e}`,
			updated_at: undefined,
		})));
	}

	async test(): Promise<boolean> {
		const { rows: [entity] } = await this
			.model
			.pool
			.query<{ test: boolean; }>(queries.test());

		if (!entity) return false;

		return entity.test;
	}
}

export const domain = (creds: PG.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
