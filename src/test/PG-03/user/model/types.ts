export type CreateFields = Pick<TableFields,
	| "first_name"
	| "id_user_role"
> & Partial<Pick<TableFields,
	| "last_name"
>>;

export type ListedEntity = {
	first_name: NonNullable<TableFields["first_name"]>;
	id: TableFields["id"];
	last_name: NonNullable<TableFields["last_name"]>;
	ur_id: string;
	ur_title: "admin" | "head" | "booker";
};

export type SearchFields = Partial<TableFields>;

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
