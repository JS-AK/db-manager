/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import * as Types from "../types/index.js";
import { walk } from "./helpers.js";

type TFile = { fileName: string; filePath: string; timestamp: number; type: "sql" | "js"; };

/**
 * @experimental
 */
export async function start(
	pool: Types.Pool,
	settings: {
		pathToSQL?: string;
		pathToJS?: string;
		migrationsTableName: string;
	},
) {
	try {
		const files: TFile[] = [];
		const jsFiles = settings.pathToJS ? await walk(settings.pathToJS) : [];
		const sqlFiles = settings.pathToSQL ? await walk(settings.pathToSQL) : [];

		for (const file of sqlFiles) {
			const fileNameBase = path.parse(file).base;

			files.push({
				fileName: fileNameBase,
				filePath: file,
				timestamp: parseInt(fileNameBase.split("_")[0] || ""),
				type: "sql",
			});
		}

		for (const file of jsFiles) {
			const fileNameBase = path.parse(file).base;

			if (fileNameBase.split(".js").length === 1) continue;
			files.push({
				fileName: fileNameBase,
				filePath: file,
				timestamp: parseInt(fileNameBase.split("_")[0] || ""),
				type: "js",
			});
		}

		if (!files.length) throw new Error("pathToJS and pathToSQL is empty");

		const sortedByTimestamp = files.sort((a, b) => {
			if (a.timestamp > b.timestamp) return 1;
			if (a.timestamp < b.timestamp) return -1;

			return 0;
		});

		let error = false;

		const migrations: string[] = [];

		try {
			migrations
				.push(
					...(await pool.query<Types.RowDataPacket<{ title: string; }>>(`SELECT title FROM ${settings.migrationsTableName}`))[0]
						.map((e: { title: string; }) => e.title),
				);
		} catch (err) {
			error = true;

			await pool.query(`
				CREATE TABLE ${settings.migrationsTableName}(
				  id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				  title                           VARCHAR(255) NOT NULL UNIQUE,
				  created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
				  updated_at                      DATETIME
				)
			`);
		}

		for (const file of sortedByTimestamp) {
			if (file.type === "sql") {
				const { fileName, filePath } = file;

				if (error) {
					const sql = fs.readFileSync(filePath).toString();

					await pool.query(sql);
					await pool.query(`INSERT INTO ${settings.migrationsTableName} (title) VALUES ('${fileName}')`);

					console.log(`${fileName} done!`);
				} else {
					if (!migrations.includes(fileName)) {
						const sql = fs.readFileSync(filePath).toString();

						await pool.query(sql);
						await pool.query(`INSERT INTO ${settings.migrationsTableName} (title) VALUES ('${fileName}')`);

						console.log(`${fileName} done!`);
					}
				}
			} else if (file.type === "js") {
				const { fileName, filePath } = file;

				if (!migrations.includes(fileName)) {
					const file = await import(pathToFileURL(filePath).href);
					const { error, message } = await file.up(pool);

					if (!error) {
						await pool.query(`INSERT INTO ${settings.migrationsTableName} (title) VALUES ('${fileName}')`);
						console.log(`${fileName} done!`);
					} else {
						console.error(`${fileName} not done!`);
						console.error(message);

						throw new Error(message);
					}
				}
			}
		}
		console.log("All done!");
	} catch (error) {
		console.error(error);

		throw error;
	}
}
