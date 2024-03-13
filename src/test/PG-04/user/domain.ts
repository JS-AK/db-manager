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

	async getAll() {
		return this.model
			.queryBuilder()
			.select(["*"])
			.execute<Types.TableFields>();
	}

	async getAllNotDeletedWithRole() {
		return this.model
			.queryBuilder()
			.select(["*"])
			.where({
				params: {
					id_user_role: { $ne: null },
					is_deleted: false,
				},
			})
			.execute<Types.TableFields>();
	}

	async getAllWithTitleUser() {
		return this.model
			.queryBuilder()
			.select([
				"users.first_name AS first_name",
				"users.id AS id",
				"users.last_name AS last_name",
				"ur.id AS ur_id",
				"ur.title AS ur_title",
			])
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
				targetTableNameAs: "ur",
			})
			.where({ params: { "ur.title": "user" } })
			.orderBy([{ column: "users.first_name", sorting: "ASC" }])
			.execute<Types.ListedEntity>();
	}

	async getAllWithTitleUserWithPagination() {
		return this.model
			.queryBuilder()
			.select([
				"users.first_name AS first_name",
				"users.id AS id",
				"users.last_name AS last_name",
				"user_roles.id AS ur_id",
				"user_roles.title AS ur_title",
			])
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
			})
			.where({ params: { "user_roles.title": "user" } })
			.orderBy([{ column: "users.first_name", sorting: "ASC" }])
			.pagination({ limit: 3, offset: 1 })
			.execute<Types.ListedEntity>();
	}

	async getCountByUserRolesTitle() {
		return this.model
			.queryBuilder()
			.select([
				"COUNT(users.id) AS users_count",
				"user_roles.title AS title",
			])
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
			})
			.where({ params: { "users.is_deleted": false } })
			.orderBy([{ column: "user_roles.title", sorting: "ASC" }])
			.groupBy(["user_roles.title"])
			.execute<Types.UsersByUserRoleTitle>();
	}

	async getCountByUserRolesTitleWithCountGte5() {
		return this.model
			.queryBuilder()
			.select([
				"COUNT(users.id) AS users_count",
				"user_roles.title AS title",
			])
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
			})
			.where({ params: { "users.is_deleted": false } })
			.orderBy([{ column: "user_roles.title", sorting: "ASC" }])
			.groupBy(["user_roles.title"])
			.having({ params: { "COUNT(users.id)": { $gte: 5 } } })
			.execute<Types.UsersByUserRoleTitle>();
	}
}
