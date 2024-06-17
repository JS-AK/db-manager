import pg from "pg";

type ClearDate = Omit<Date, Extract<keyof Date, string>>;
type ClearString = Omit<string, Extract<keyof string, string>>;
type ClearNumber = Omit<number, Extract<keyof number, string>>;
type ClearBoolean = Omit<boolean, Extract<keyof boolean, string>>;

export type SND = ClearString | ClearNumber | ClearDate;
export type SNDArray = ClearString[] | ClearNumber[] | ClearDate[];
export type SNDB = SND | ClearBoolean;
export type SNDBArray = SNDArray | ClearBoolean[];
export type TDBCreds = pg.PoolConfig & { database: string; host: string; password: string; port: number; user: string; };
export type TDBOptions = { insertOptions?: { onConflict: string; }; };
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
export type TTable = {
	createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	primaryKey: string | null;
	tableFields: string[];
	tableName: string;
	updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
};
