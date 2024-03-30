import mysql from "mysql2/promise";

export type ResultSetHeader = mysql.ResultSetHeader;
export type RowDataPacket = mysql.RowDataPacket;

export type TDBCreds = mysql.PoolOptions & { database: string; host: string; password: string; port: number; user: string; };
export type TField = { key: string; sign?: string; operator: TOperator; };
export type TOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "$in" | "$nin" | "$like" | "$nlike" | "$custom";
export type TSearchParams = {
	[key: string]: {
		$ne?: number | string | boolean | null;
		$gt?: number | string | boolean;
		$gte?: number | string | boolean;
		$lt?: number | string | boolean;
		$lte?: number | string | boolean;
		$like?: string;
		$nlike?: string;
		$custom?: { sign: string; value: string | number; };
		$in?: string[] | number[] | boolean[];
		$nin?: string[] | number[] | boolean[];
	}
	| null
	| string
	| number
	| boolean
	| undefined;
};
export type TTable = {
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	isPKAutoIncremented?: boolean;
	primaryKey: string | string[];
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
