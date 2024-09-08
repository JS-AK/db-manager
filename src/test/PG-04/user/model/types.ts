import * as DbManager from "../../../../index.js";

export type CreateFields = Pick<TableFields,
	| "first_name"
	| "id_user_role"
> & Partial<Pick<TableFields,
	| "last_name"
>>;

export type ListOrderBy = "u.created_at";
export type ListedEntity = {
	id: TableFields["id"];

	first_name: NonNullable<TableFields["first_name"]>;
	last_name: NonNullable<TableFields["last_name"]>;

	ur_id: string;
	ur_title: string;
};

export type SearchFields = Partial<TableFields>;

export type SearchFieldsList = DbManager.PG.DomainTypes.TSearchParams<SearchListFields>;
export type SearchFieldsListOr = SearchFieldsList[] | undefined;

export type SearchListFields = {
	"u.id"?: TableFields["id"];
	"u.is_deleted"?: TableFields["is_deleted"];

	"ur.title"?: string;
};

export type TableFields = {
	id: string;

	id_user_role: string;

	first_name: string;
	last_name: string;

	deleted_at: Date | null;
	is_deleted: boolean;

	created_at: Date;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "first_name"
	| "is_deleted"
	| "last_name"
>>;

export type UsersByUserRoleTitle = {
	users_count: string;
	title: string;
};
