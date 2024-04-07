// ----- Dependencies --------------------------
import { PG, Types } from "../../../../index.js";

import { TableKeys } from "./types.js";

// ----- Class ------------------------------
export class Model extends PG.BaseModel {
	constructor(creds: PG.ModelTypes.TDBCreds, options?: PG.ModelTypes.TDBOptions) {
		super(
			{
				createField,
				primaryKey,
				tableFields,
				tableName,
				updateField,
			},
			creds,
			options,
		);
	}

	async getList({ order, pagination, params = {} }: {
		order?: { orderBy: string; ordering: Types.TOrdering; }[];
		pagination?: { limit: number; offset: number; };
		params?: PG.ModelTypes.TSearchParams;
		paramsOr?: PG.ModelTypes.TSearchParams[];
	}) {
		const { queryArray, values } = this.compareFields(params);
		const selected = [
			"u.first_name AS first_name",
			"u.last_name  AS last_name",
			"u.id         AS id",
			"u.is_deleted AS is_deleted",
			"ur.id        AS ur_id",
			"ur.title     AS ur_title",
		];

		const {
			orderByFields,
			paginationFields,
			searchFields,
			selectedFields,
		} = this.getFieldsToSearch(
			{ queryArray },
			selected,
			pagination,
			order,
		);

		return (await this.pool.query(queries.getList(
			orderByFields,
			paginationFields,
			searchFields,
			selectedFields,
		), values)).rows;
	}

}

// ----- Table properties ----------------------
const tableName = "users"; // table from DB
const primaryKey = "id"; // primaryId from table
const createField = { title: "created_at", type: "unix_timestamp" } as const;
const updateField = { title: "updated_at", type: "unix_timestamp" } as const;
const tableFields: TableKeys[] = [
	"created_at",
	"first_name",
	"id",
	"id_user_role",
	"is_deleted",
	"last_name",
	"updated_at",
];

// ----- queries -----------------------
const queries = {
	getList(
		orderByFields: string,
		paginationFields: string,
		searchFields: string,
		selectedFields: string,
	) {
		return `
			SELECT ${selectedFields}
			FROM ${tableName} u
			JOIN user_roles ur ON ur.id = u.id_user_role
			${searchFields}
			${orderByFields}
			${paginationFields}
		`;
	},
};
