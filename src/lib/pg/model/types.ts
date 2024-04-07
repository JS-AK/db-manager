import pg from "pg";

export type SND = string | number | Date;
export type SNDArray = string[] | number[] | Date[];
export type SNDB = SND | boolean;
export type SNDBArray = SNDArray | boolean[];
export type TDBCreds = pg.PoolConfig & { database: string; host: string; password: string; port: number; user: string; };
export type TDBOptions = { insertOptions?: { isOnConflictDoNothing: boolean; }; };
export type TField = { key: string; sign?: string; operator: TOperator; };
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
export type TSearchParams = {
	[key: string]:
	| TSearchParamsWithOperator
	| TSearchParamsWithOperator[]
	| SNDB
	| null
	| undefined;
};
export type TSearchParamsWithOperator = {
	$eq?: SNDB | SNDArray | null;
	$ne?: SNDB | null;
	$custom?: { sign: string; value: SND; };
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
	"$@>"?: SND | SNDArray;
	"$<@"?: SND | SNDArray;
	"$&&"?: SNDArray;
	"$@"?: string | string[];
	"$~"?: string | string[];
	"$?"?: string | string[];
};
export type TTable = {
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	primaryKey: string | null;
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
