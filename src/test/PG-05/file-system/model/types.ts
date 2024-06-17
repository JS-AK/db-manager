export type CreateFields = Pick<TableFields,
	| "is_folder"
	| "name"
	| "path"
>;

export type SearchFields = Partial<TableFields>;

export type TableFields = {
	id: string;

	is_folder: boolean;
	name: string;
	path: string;

	created_at: Date;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "name"
	| "path"
>>;
