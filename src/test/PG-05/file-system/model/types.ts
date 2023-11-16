export type CreateFields = Pick<TableFields,
	| "is_folder"
	| "name"
	| "path"
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
	name: string;
	is_folder: boolean;
	path: string;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "name"
	| "path"
>>;
