import mysql from "mysql2/promise";

export type ResultSetHeader = mysql.ResultSetHeader;
export type RowDataPacket = mysql.RowDataPacket;

export type SND = string | number | Date;
export type SNDArray = string[] | number[] | Date[];
export type SNDB = SND | boolean;
export type SNDBArray = SNDArray | boolean[];
export type TDBCreds = mysql.PoolOptions & { database: string; host: string; password: string; port: number; user: string; };
export type TField = { key: string; sign?: string; operator: TOperator; };
export type TOperator =
	| "="
	| "<>"
	| ">"
	| ">="
	| "<"
	| "<="
	| "$custom"
	| "$eq"
	| "$in"
	| "$nin"
	| "$like"
	| "$ilike"
	| "$nlike"
	| "$nilike"
	| "$withoutParameters";
export type TSearchParams = {
	[key: string]:
	| TSearchParamsWithOperator
	| SNDB
	| null
	| undefined;
};
export type TSearchParamsWithOperator = {
	$eq?: SNDB | null;
	$ne?: SNDB | null;
	$custom?: { sign: string; value: string | number; };
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
};
export type TTable = {
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	isPKAutoIncremented?: boolean;
	primaryKey: string | string[];
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
