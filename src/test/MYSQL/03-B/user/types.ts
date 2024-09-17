import { MYSQL } from "../../mysql.js";

export type CreateFields = Pick<TableFields,
	| "first_name"
	| "id_user_role"
> & Partial<Pick<TableFields,
	| "last_name"
>>;

export type ListedEntity = {
	id: TableFields["id"];

	first_name: TableFields["first_name"];
	last_name: TableFields["last_name"];
	is_deleted: TableFields["is_deleted"];

	user_role_id: string;
	user_role_title: string;
};

export type SearchFields = Partial<TableFields>;

export type SearchFieldsList = MYSQL.DomainTypes.TSearchParamsStrict<SearchListFields>;
export type SearchFieldsListOr = SearchFieldsList[] | undefined;

export type SearchListFields = {
	"users.is_deleted"?: TableFields["is_deleted"];
	"user_roles.title"?: string;
};

export type TableFields = {
	id: number;

	id_user_role: number;

	first_name: string | null;
	last_name: string | null;

	deleted_at: number | null;
	is_deleted: number;

	created_at: number;
	updated_at: number | null;
};

export type UpdateFields = Partial<Pick<TableFields,
	| "first_name"
	| "last_name"

	| "deleted_at"
	| "is_deleted"
>>;
