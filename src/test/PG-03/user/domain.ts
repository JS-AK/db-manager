import { Types as CoreTypes, PG } from "../../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";

class Domain extends PG.Domain.BaseTable<ReturnType<typeof model>, {
	CoreFields: Types.TableFields;
}> {
	#normalizeListParams(params: Types.SearchFieldsList): Types.SearchFieldsList {
		return {
			"user_roles.title": params["user_roles.title"],
			"users.is_deleted": typeof params["users.is_deleted"] === "boolean"
				? params["users.is_deleted"]
				: false,
		};
	}

	async getList(
		data: {
			order?: { column: "users.first_name"; sorting: CoreTypes.TOrdering; }[];
			pagination?: CoreTypes.TPagination;
			params: Types.SearchFieldsList;
			paramsOr?: Types.SearchFieldsListOr;
		},
	): Promise<Types.ListedEntity[]> {
		const {
			order,
			pagination,
			params,
			paramsOr,
		} = data;

		const paramsResult = this.#normalizeListParams(params);
		const paramsOrResult = paramsOr
			? paramsOr.map((e) => this.#normalizeListParams(e))
			: undefined;

		return this.model.queryBuilder()
			.select([
				"users.id         AS id",

				"users.first_name AS first_name",
				"users.last_name  AS last_name",
				"users.is_deleted AS is_deleted",

				"user_roles.id    AS user_role_id",
				"user_roles.title AS user_role_title",
			])
			.innerJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
			})
			.where({
				params: paramsResult,
				paramsOr: paramsOrResult,
			})
			.pagination(pagination)
			.orderBy(order)
			.execute<Types.ListedEntity>();
	}
}

export const domain = (creds: PG.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
