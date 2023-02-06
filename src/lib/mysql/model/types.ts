export type TDBCreds = {
	database: string;
	host: string;
	password: string;
	poolName?: string;
	port: number;
	user: string;
};
export type TTable = {
	createField?: string;
	primaryKey: string | string[];
	tableFields: string[];
	tableName: string;
	updateField?: string;
};
export type TTableFields = { [key: string]: any; };
