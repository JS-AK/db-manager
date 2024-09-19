import { MYSQL } from "../../index.js";

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

	ur_id: number;
	ur_title: string;
};

export type SearchFields = Partial<TableFields>;

export type SearchFieldsList = MYSQL.DomainTypes.TSearchParams<SearchListFields>;
export type SearchFieldsListOr = SearchFieldsList[] | undefined;

export type SearchListFields = {
	"u.id"?: TableFields["id"];
	"u.is_deleted"?: TableFields["is_deleted"];

	"ur.title"?: string;
};

export type TableFields = {
	id: number;

	id_user_role: number;

	first_name: string | null;
	last_name: string | null;

	deleted_at: Date | null;
	is_deleted: 0 | 1;

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
	users_count: number;
	title: string;
};
