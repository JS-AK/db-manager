import { PG } from "../../../index.js";

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

export type SearchFieldsList = PG.DomainTypes.TSearchParamsStrict<SearchListFields>;
export type SearchFieldsListOr = SearchFieldsList[] | undefined;

export type SearchListFields = {
	"users.is_deleted"?: boolean;
	"user_roles.title"?: string;
};

export type TableFields = {
	created_at: string;
	first_name: string;
	id: string;
	id_user_role: string;
	is_deleted: boolean;
	last_name: string;
	updated_at: string | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "first_name"
	| "is_deleted"
	| "last_name"
>>;
