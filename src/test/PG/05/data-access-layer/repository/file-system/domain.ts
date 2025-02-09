import { PG } from "../../../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";

export class Domain extends PG.Domain.BaseTable<PG.Model.BaseTable, {
	CreateFields: Types.CreateFields;
	CoreFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {
	async getAll() {
		return this.model.queryBuilder()
			.select([
				"name",
				"path",
			])
			.execute<Types.GetAll>();
	}

	async getAllInsideHomePath() {
		return this.model.queryBuilder()
			.select([
				"name",
				"path",
			])
			.where({ params: { path: { "$<@": "root.home" } } })
			.execute<Types.GetAllInsideHomePath>();
	}

	async getAllOutsideHomePath() {
		return this.model.queryBuilder()
			.select(["name", "path"])
			.where({ params: { path: { "$@>": "root.home" } } })
			.execute<Types.GetAllOutsideHomePath>();
	}

	async getAllWithLevel() {
		return this.model.queryBuilder()
			.select([
				"name",
				"path",
				"NLEVEL(path) as level",
			])
			.execute<Types.GetAllWithLevel>();
	}
}

export const domain = (creds: PG.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
