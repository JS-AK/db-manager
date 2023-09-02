export type CreateFields = Pick<TableFields,
	| "title"
>;

export type EntityListed = Pick<TableFields,
	| "title"
>;

export type SearchFields = Partial<TableFields>;

export type TableFields = {
	title: string;
};

export type TableKeys = keyof TableFields;

export type UpdateFields = Partial<Pick<TableFields,
	| "title"
>>;
