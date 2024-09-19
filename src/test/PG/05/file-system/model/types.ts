export type CreateFields = Pick<TableFields,
	| "is_folder"
	| "name"
	| "path"
>;

export type GetAll = Pick<TableFields, "name" | "path">;
export type GetAllInsideHomePath = Pick<TableFields, "name" | "path">;
export type GetAllOutsideHomePath = Pick<TableFields, "name" | "path">;
export type GetAllWithLevel = Pick<TableFields, "name" | "path"> & { level: number; };

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
