import mysql from "mysql2/promise";

import * as SharedTypes from "../../../shared-types/index.js";

type ClearDate = Omit<Date, Extract<keyof Date, string>>;
type ClearString = Omit<string, Extract<keyof string, string>>;
type ClearNumber = Omit<number, Extract<keyof number, string>>;
type ClearBoolean = Omit<boolean, Extract<keyof boolean, string>>;

export type ResultSetHeader = mysql.ResultSetHeader;
export type RowDataPacket = mysql.RowDataPacket;

export type SND = ClearString | ClearNumber | ClearDate;
export type SNDArray = ClearString[] | ClearNumber[] | ClearDate[];
export type SNDB = SND | ClearBoolean;
export type SNDBArray = SNDArray | ClearBoolean[];
export type TDBCreds = mysql.PoolOptions & { database: string; host: string; password: string; port: number; user: string; };
export type TDBOptions = TMVOptions & { insertOptions?: { onConflict: string; }; };
export type TField = { key: string; sign?: string; operator: TOperator; };
export type TMVOptions = {
	isLoggerEnabled?: true;
	logger?: SharedTypes.TLogger;
	client?: mysql.Pool | mysql.PoolConnection | mysql.Connection;
};
export type TOperator =
	| "="
	| "<>"
	| ">"
	| ">="
	| "<"
	| "<="
	// | "@>"
	// | "<@"
	// | "&&"
	// | "@"
	// | "~"
	// | "?"
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
	// $jsonb?: object;
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
	// "$@>"?: SNDB | SNDBArray;
	// "$<@"?: SNDB | SNDBArray;
	// "$&&"?: SNDB | SNDBArray;
	// "$@"?: string | string[];
	// "$~"?: string | string[];
	// "$?"?: string | string[];
};
export type TTable<T extends readonly string[] | string[] = readonly string[]> = {
	additionalSortingFields?: string[];
	createField: { title: T[number]; type: "unix_timestamp" | "timestamp"; } | null;
	isPKAutoIncremented?: boolean;
	primaryKey: T[number] | [T[number], T[number], ...T[number][]] | null;
	tableFields: T;
	tableName: string;
	updateField: { title: T[number]; type: "unix_timestamp" | "timestamp"; } | null;
};
export type TVOptions = TMVOptions;
