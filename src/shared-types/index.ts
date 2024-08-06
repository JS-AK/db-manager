export type TLogger = { error: (str: string) => void; info: (str: string) => void; };
export type TOrdering = "ASC" | "DESC";
export type TPagination = { limit: number; offset: number; };
export type TPrimaryKeyField = string | string[];
export type TPrimaryKeyValue = string | number | (number | string)[];
export type TRawParams = {
	[key: string]: object | string | number | boolean | null | undefined;
};
export type TRawParamsPrepared = {
	[key: string]: object | string | number | boolean | null;
};
