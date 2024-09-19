import { start as startMYSQL01 } from "./MYSQL/01/index.js";
import { start as startMYSQL02 } from "./MYSQL/02/index.js";
import { start as startMYSQL03A } from "./MYSQL/03-A/index.js";
import { start as startMYSQL03B } from "./MYSQL/03-B/index.js";
import { start as startMYSQL04 } from "./MYSQL/04/index.js";

import { start as startPG01 } from "./PG/01/index.js";
import { start as startPG02 } from "./PG/02/index.js";
import { start as startPG03 } from "./PG/03/index.js";
import { start as startPG04 } from "./PG/04/index.js";
import { start as startPG05 } from "./PG/05/index.js";
import { start as startPG06 } from "./PG/06/index.js";

const startMYSQLTests = async () => {
	const creds = {
		database: "test-base",
		host: process.env.MYSQL_HOST || "localhost",
		password: "test-password",
		port: Number(process.env.MYSQL_PORT) || 3306,
		user: "test-user",
	};

	await startMYSQL01(creds);
	await startMYSQL02(creds);
	await startMYSQL03A(creds);
	await startMYSQL03B(creds);
	await startMYSQL04(creds);
};

const startPGTests = async () => {
	const creds = {
		database: "postgres",
		host: process.env.POSTGRES_HOST || "localhost",
		password: "admin",
		port: Number(process.env.POSTGRES_PORT) || 5432,
		user: "postgres",
	};

	await startPG01(creds);
	await startPG02(creds);
	await startPG03(creds);
	await startPG04(creds);
	await startPG05(creds);
	await startPG06(creds);
};

await startMYSQLTests();
await startPGTests();
