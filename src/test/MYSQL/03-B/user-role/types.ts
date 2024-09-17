export type CreateFields = Pick<TableFields,
	| "title"
>;

export type SearchFields = Partial<TableFields>;

export type TableFields = {
	id: number;

	title: string;

	created_at: number;
	updated_at: number | null;
};

export type UpdateFields = Partial<Pick<TableFields,
	| "title"
>>;
