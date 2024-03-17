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
	| "$between"
	| "$in"
	| "$like"
	| "$ilike"
	| "$nbetween"
	| "$nlike"
	| "$nilike"
	| "$nin";
export type TSearchParams = {
	[key: string]:
	| TSearchParamsWithOperator
	| TSearchParamsWithOperator[]
	| SNDB
	| null
	| undefined;
};
export type TSearchParamsWithOperator = {
	$custom?: { sign: string; value: SND; };
	$between?: [SND, SND];
	$gt?: SND;
	$gte?: SND;
	$in?: SNDBArray;
	"$@>"?: SND | SNDArray;
	"$<@"?: SND | SNDArray;
	"$&&"?: SNDArray;
	"$@"?: string;
	"$~"?: string;
	"$?"?: string;
	$json?: object;
	$jsonb?: object;
	$like?: string;
	$ilike?: string;
	$lt?: SND;
	$lte?: SND;
	$nbetween?: [SND, SND];
	$ne?: SNDB | null;
	$nin?: SNDBArray;
	$nlike?: string;
	$nilike?: string;
};
export type TTable = {
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	primaryKey: string | null;
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
