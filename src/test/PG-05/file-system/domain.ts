import * as DbManager from "../../../index.js";

import { Model, Types } from "./model/index.js";

export class Domain extends DbManager.PG.Domain.BaseTable<Model, {
	CreateFields: Types.CreateFields;
	CoreFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {

	constructor(creds: DbManager.PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}

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
