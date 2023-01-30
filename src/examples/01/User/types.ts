export type CreateFields = Pick<TableFields,
	| "firstname"
	| "lastname"
>;

export type EntityFull = Pick<TableFields,
	| "created_at"
	| "id"
	| "firstname"
	| "lastname"
	| "updated_at"
>;

export type EntityListed = Pick<TableFields,
	| "id"
	| "firstname"
	| "lastname"
>;

export type SearchFields = Partial<Omit<TableFields,
	| "created_at"
	| "updated_at"
>> & {
	created_at?: string;
	updated_at?: string | null;
};

export type TableFields = {
	created_at: Date;
	id: string;
	firstname: string;
	lastname: string;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "firstname"
	| "lastname"
>>;
