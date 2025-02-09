import { PG, Types as PGTypes } from "../../../../index.js";

import * as Types from "./types.js";

import { model } from "./model.js";

class Domain extends PG.Domain.BaseTable<PG.Model.BaseTable, {
	CreateFields: Types.CreateFields;
	SearchFields: Types.SearchFields;
	CoreFields: Types.TableFields;
	UpdateFields: Types.UpdateFields;
}> {
	async create(data: {
		first_name: string;
		id_user_role: string;
		last_name?: string;
	}[]) {
		return this.model.queryBuilder()
			.insert<Types.CreateFields>({
				isUseDefaultValues: true,
				params: data,
				updateColumn: { title: "updated_at", type: "timestamp" },
			})
			.returning(["id"])
			.execute<{ id: string; }>();
	}

	async getAll() {
		return this.model.queryBuilder()
			.select(["*"])
			.execute<Types.TableFields>();
	}

	async getAllNotDeletedWithRole() {
		return this.model.queryBuilder()
			.select(["*"])
			.where({ params: { id_user_role: { $ne: null }, is_deleted: false } })
			.execute<Types.TableFields>();
	}

	async getAllWithTitleUser() {
		return this.model.queryBuilder({ tableName: "users u" })
			.select([
				"u.first_name AS first_name",
				"u.id AS id",
				"u.last_name AS last_name",
				"ur.id AS ur_id",
				"ur.title AS ur_title",
			])
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
				targetTableNameAs: "ur",
			})
			.where({ params: { "ur.title": { $eq: "user" } } })
			.orderBy([{ column: "u.first_name", sorting: "ASC" }])
			.execute<Types.ListedEntity>();
	}

	async getAllWithTitleUserWithPagination() {
		return this.model.queryBuilder()
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
		return this.model.queryBuilder()
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
		return this.model.queryBuilder()
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

	async getList(data: {
		order: { column: Types.ListOrderBy; sorting: PGTypes.TOrdering; }[];
		pagination: PGTypes.TPagination;
		params: {
			ids?: string[];
			userRoleTitle?: string;
		};
	}) {
		const params: Types.SearchFieldsList = {
			"u.id": data.params.ids ? { $in: data.params.ids } : undefined,
			"u.is_deleted": false,
			"ur.title": data.params.userRoleTitle,
		};

		return this.model
			.queryBuilder({ tableName: "users AS u" })
			.select([
				"u.id         AS id",
				"u.first_name AS first_name",
				"u.last_name  AS last_name",
				"ur.id        AS ur_id",
				"ur.title     AS ur_title",
			])
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
				targetTableNameAs: "ur",
			})
			.where({ params })
			.orderBy(data.order)
			.pagination(data.pagination)
			.execute<Types.ListedEntity>();
	}

	async getListAndCount(data: {
		order: { column: Types.ListOrderBy; sorting: PGTypes.TOrdering; }[];
		pagination: PGTypes.TPagination;
		params: { ids?: string[]; userRoleTitle?: string; };
	}): Promise<[Types.ListedEntity[], number]> {
		const params: Types.SearchFieldsList = {
			"u.id": data.params.ids ? { $in: data.params.ids } : undefined,
			"u.is_deleted": false,
			"ur.title": data.params.userRoleTitle,
		};

		const query = this.model
			.queryBuilder({ tableName: "users AS u" })
			.rightJoin({
				initialField: "id_user_role",
				targetField: "id",
				targetTableName: "user_roles",
				targetTableNameAs: "ur",
			})
			.where({ params });

		const queryList = query.clone();
		const queryTotal = query.clone();

		const [list, total] = await Promise.all([
			queryList
				.select([
					"u.id         AS id",
					"u.first_name AS first_name",
					"u.last_name  AS last_name",
					"ur.id        AS ur_id",
					"ur.title     AS ur_title",
				])
				.orderBy(data.order)
				.pagination(data.pagination)
				.execute<Types.ListedEntity>(),
			queryTotal
				.select(["COUNT(*) as count"])
				.execute<{ count: string; }>(),
		]);

		return [list, Number(total[0]?.count) || 0];
	}

	async getActualByParams(data: {
		ids: { $in: string[]; } | { $nin: string[]; };
		first_name: { $ilike: string; };
	}) {
		return this.model.queryBuilder()
			.select(["*"])
			.where<Types.TableFields>({
				params: {
					first_name: data.first_name,
					id: data.ids,
					is_deleted: false,
				},
			})
			.execute();
	}
}

export const domain = (creds: PG.ModelTypes.TDBCreds) =>
	new Domain({ model: model(creds) });
