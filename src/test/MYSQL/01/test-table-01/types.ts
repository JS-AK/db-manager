export type CreateFields = Pick<TableFields,
	| "title"
> & Partial<Pick<TableFields,
	| "description"
>>;

export type EntityFull = Pick<TableFields,
	| "id"

	| "title"

	| "created_at"
	| "updated_at"
>;

export type EntityListed = Pick<TableFields,
	| "id"
	| "title"
>;

export type SearchFields = Partial<TableFields>;

export type TableFields = {
	id: number;

	description: string | null;
	title: string;

	created_at: Date;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "description"
	| "title"
>>;
