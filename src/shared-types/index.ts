export type TOrdering = "ASC" | "DESC";
export type TPagination = { limit: number; offset: number; };
export type TRawParams = {
	[key: string]: object | string | string[] | number | number[] | boolean | null | undefined;
};
export type TRawParamsPrepared = {
	[key: string]: object | string | string[] | number | number[] | boolean | null;
};
