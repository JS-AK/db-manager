export type CreateFields = Pick<TableFields,
	| "title"
>;

export type SearchFields = Partial<TableFields>;

export type TableFields = {
	id: number;

	title: string;

	created_at: Date;
	updated_at: Date | null;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "title"
>>;
