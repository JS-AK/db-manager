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
	operator: "=" | "<>" | ">" | ">=" | "<" | "<=" | "$in" | "$nin" | "$like" | "$nlike" | "$custom";
};
export type TSearchParams = {
	[key: string]: {
		$ne?: number | string | boolean | null;
		$gt?: number | string | boolean;
		$gte?: number | string | boolean;
		$json?: object;
		$jsonb?: object;
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
	createField: string | null;
	primaryKey: string | null;
	tableFields: string[];
	tableName: string;
	updateField: string | null;
};
