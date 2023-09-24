import * as DbManager from "../../../index.js";

import { Model, Types } from "./model/index.js";

export type SearchFieldsList = DbManager.PG.DomainTypes.TSearchParams<Types.SearchListFields>;
export type SearchFieldsListOr = DbManager.PG.DomainTypes.TArray2OrMore<SearchFieldsList>;

export class Domain extends DbManager.PG.BaseDomain<{
	Model: Model;
	CreateFields: Types.CreateFields;
	SearchFields: Types.SearchFields;
	TableFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {

	constructor(creds: DbManager.PG.ModelTypes.TDBCreds) {
		super({ model: new Model(creds) });
	}

	async getList(
		data: {
			order?: { orderBy: "u.first_name"; ordering: DbManager.Types.TOrdering; }[];
			pagination?: DbManager.Types.TPagination;
			params: SearchFieldsList;
			paramsOr?: SearchFieldsListOr;
		},
	): Promise<Types.ListedEntity[]> {
		return this.model.getList(data);
	}
}
