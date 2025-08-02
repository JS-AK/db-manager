import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";

export type ClearBoolean = Omit<boolean, Extract<keyof boolean, string>>;
export type ClearDate = Omit<Date, Extract<keyof Date, string>>;
export type ClearNumber = Omit<number, Extract<keyof number, string>>;
export type ClearString = Omit<string, Extract<keyof string, string>>;

export type Join = "CROSS" | "FULL OUTER" | "INNER" | "LEFT" | "RIGHT";
export type SND = ClearString | ClearNumber | ClearDate;
export type SNDArray = ClearString[] | ClearNumber[] | ClearDate[];
export type SNDB = SND | ClearBoolean;
export type SNDBArray = SNDArray | ClearBoolean[];
export type TDBCreds = pg.PoolConfig & { database: string; host: string; password: string; port: number; user: string; };
export type TDBOptions = TMVOptions & {
	insertOptions?: { onConflict: string; };
};
export type TDBOptionsWithoutClient = TMVOptionsWithoutClient & {
	insertOptions?: { onConflict: string; };
};
export type TExecutor = pg.Pool | pg.PoolClient | pg.Client;
export type TField = { key: string; sign?: string; operator: TOperator; };
export type TMVOptions = {
	isLoggerEnabled?: boolean;
	logger?: SharedTypes.TLogger;
	client?: TExecutor;
};
export type TMVOptionsWithoutClient = {
	isLoggerEnabled?: boolean;
	logger?: SharedTypes.TLogger;
};
export type TMaterializedView<T extends readonly string[] | string[] = readonly string[]> = {
	additionalSortingFields?: string[];
	coreFields: T;
	name: string;
};
export type TOperator =
	| "="
	| "<>"
	| ">"
	| ">="
	| "<"
	| "<="
	| "@>"
	| "<@"
	| "&&"
	| "@"
	| "~"
	| "?"
	| "$custom"
	| "$eq"
	| "$between"
	| "$in"
	| "$like"
	| "$ilike"
	| "$nbetween"
	| "$nlike"
	| "$nilike"
	| "$nin"
	| "$withoutParameters";
export type TSOptions = TMVOptions;
export type TSOptionsWithoutClient = TMVOptionsWithoutClient;
export type TSearchParams = {
	[key: string]:
	| TSearchParamsWithOperator
	| TSearchParamsWithOperator[]
	| SNDB
	| null
	| undefined;
};
export type TSearchParamsWithOperator = {
	$eq?: SNDB | SNDBArray | null | object;
	$ne?: SNDB | null | object;
	$custom?: { sign: string; value: SNDB; };
	$between?: [SND, SND];
	$nbetween?: [SND, SND];
	$json?: object;
	$jsonb?: object;
	$gt?: SND;
	$gte?: SND;
	$lt?: SND;
	$lte?: SND;
	$in?: SNDBArray;
	$nin?: SNDBArray;
	$like?: string;
	$ilike?: string;
	$nlike?: string;
	$nilike?: string;
	"$@>"?: SNDB | SNDBArray;
	"$<@"?: SNDB | SNDBArray;
	"$&&"?: SNDB | SNDBArray;
	"$@"?: string | string[];
	"$~"?: string | string[];
	"$?"?: string | string[];
};
export type TSequence = {
	name: string;
};
export type TTable<T extends readonly string[] | string[] = readonly string[]> = {
	additionalSortingFields?: string[];
	createField: { title: T[number]; type: "unix_timestamp" | "timestamp"; } | null;
	primaryKey: T[number] | [T[number], T[number], ...T[number][]] | null;
	tableFields: T;
	tableName: string;
	updateField: { title: T[number]; type: "unix_timestamp" | "timestamp"; } | null;
};
export type TVOptions = TMVOptions;
export type TVOptionsWithoutClient = TMVOptionsWithoutClient;
export type TView<T extends readonly string[] | string[] = readonly string[]> = TMaterializedView<T>;
