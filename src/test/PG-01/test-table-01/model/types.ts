export type CreateFields = Pick<TableFields,
	| "meta"
	| "number_key"
	| "title"
> & Partial<Pick<TableFields,
	| "books"
	| "description"
	| "number_range"
>>;

export type EntityFull = Pick<TableFields,
	| "created_at"
	| "id"
	| "title"
	| "updated_at"
>;

export type EntityListed = Pick<TableFields,
	| "id"
	| "title"
>;

export type SearchFields = Partial<Omit<TableFields,
	| "created_at"
	| "updated_at"
>> & {
	created_at?: string;
	updated_at?: string | null;
};

export type TableFields = {
	id: string;

	books: string[];
	description: string | null;
	meta: { firstName: string; lastName: string; };
	number_key: number;
	number_range: string | null;
	title: string;

	created_at: Date;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "description"
	| "meta"
	| "number_range"
	| "title"
>>;
