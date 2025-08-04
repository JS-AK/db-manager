export type CreateFields = Pick<TableFields,
	| "first_name"
	| "last_name"
>;

export type EntityFull = Pick<TableFields,
	| "id"

	| "first_name"
	| "last_name"

	| "created_at"
	| "updated_at"
>;

export type EntityListed = Pick<TableFields,
	| "id"

	| "first_name"
	| "last_name"
>;

export type SearchFields = Partial<TableFields>;

export type TableFields = {
	id: string;

	first_name: string;
	last_name: string;

	created_at: Date;
	updated_at: Date | null;
};

export type UpdateFields = Partial<Pick<TableFields,
	| "first_name"
	| "last_name"
>>;
