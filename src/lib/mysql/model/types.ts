export type TDBCreds = {
	database: string;
	host: string;
	password: string;
	poolName?: string;
	port: number;
	user: string;
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
	createField?: string;
	primaryKey: string | string[];
	tableFields: string[];
	tableName: string;
	updateField?: string;
};
