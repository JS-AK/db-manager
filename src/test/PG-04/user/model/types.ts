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
	ur_title: "admin" | "head" | "booker";
};

export type SearchFields = Partial<Omit<TableFields,
	| "created_at"
	| "updated_at"
>> & {
	created_at?: string;
	updated_at?: string | null;
};

export type SearchListFields = {
	"u.id"?: TableFields["id"];
	"u.is_deleted"?: TableFields["is_deleted"];
	"ur.title"?: string;
};

export type TableFields = {
	created_at: Date;
	first_name: string;
	id: string;
	id_user_role: string;
	is_deleted: boolean;
	last_name: string;
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
