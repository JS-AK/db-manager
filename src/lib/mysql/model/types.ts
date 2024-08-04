import mysql from "mysql2/promise";

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
	$eq?: SNDB | SNDBArray | null | object;
	$ne?: SNDB | null | object;
	$custom?: { sign: string; value: SNDB; };
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
	additionalSortingFields?: string[];
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	isPKAutoIncremented?: boolean;
	primaryKey: string | string[];
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
