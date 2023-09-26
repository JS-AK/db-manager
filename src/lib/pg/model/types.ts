import pg from "pg";

export type TDBCreds = pg.PoolConfig & {
	database: string;
	host: string;
	password: string;
	port: number;
	user: string;
};
export type TDBOptions = {
	insertOptions?: { isOnConflictDoNothing: boolean; };
};
export type TField = {
	key: string;
	sign?: string;
	operator: TOperator;
};
export type TOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "$custom" | "$between" | "$in" | "$like" | "$nbetween" | "$nlike" | "$nin";
export type TSearchParams = {
	[key: string]:
	| TSearchParamsWithOperator
	| boolean
	| null
	| number
	| string
	| undefined;
};
export type TSearchParamsWithOperator = {
	$custom?: { sign: string; value: string | number; };
	$between?: [number | string, number | string];
	$gt?: number | string | boolean;
	$gte?: number | string | boolean;
	$in?: string[] | number[] | boolean[];
	$json?: object;
	$jsonb?: object;
	$like?: string;
	$lt?: number | string | boolean;
	$lte?: number | string | boolean;
	$nbetween?: [number | string, number | string];
	$ne?: number | string | boolean | null;
	$nin?: string[] | number[] | boolean[];
	$nlike?: string;
};
export type TTable = {
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	primaryKey: string | null;
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
