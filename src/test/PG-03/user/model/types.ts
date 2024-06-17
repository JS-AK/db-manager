import * as DbManager from "../../../../index.js";

export type CreateFields = Pick<TableFields,
	| "first_name"
	| "id_user_role"
> & Partial<Pick<TableFields,
	| "last_name"
>>;

export type ListedEntity = {
	id: TableFields["id"];

	first_name: NonNullable<TableFields["first_name"]>;
	last_name: NonNullable<TableFields["last_name"]>;

	ur_id: string;
	ur_title: string;
};

export type SearchFields = Partial<TableFields>;

export type SearchFieldsList = DbManager.PG.DomainTypes.TSearchParams<SearchListFields>;
export type SearchFieldsListOr = DbManager.PG.DomainTypes.TArray2OrMore<SearchFieldsList>;

export type SearchListFields = {
	"u.is_deleted"?: boolean;
	"ur.title"?: string;
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
