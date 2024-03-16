/* eslint-disable no-console */

import fs from "node:fs";

import * as Types from "../types/index.js";
import { walk } from "./helpers.js";

/**
 * @experimental
 */
export async function start(
	pool: Types.Pool,
	settings: {
		migrationsTableName: string;
		// isNeedCleanupAll?: boolean;
		pathToSQL: string;
	},
) {
	try {
		const sqlFiles = await walk(settings.pathToSQL);

		for (const file of sqlFiles) {
			const sql = fs.readFileSync(file).toString();

			const tables = sql
				.toLowerCase()
				.replace(/[^a-z0-9,()_; ]/g, " ")
				.replace(/  +/g, " ")
				.trim()
				.split("create table");

			tables.shift();

			if (tables) {
				for (const table of tables) {
					const t = table.trim().split("(")[0]?.trim();

					if (!t) continue;

					await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
					console.log(`DROP TABLE ${t} done!`);
				}
			}

			const types = sql
				.toLowerCase()
				.replace(/[^a-z0-9,()_; ]/g, " ")
				.replace(/  +/g, " ")
				.trim()
				.split("create type");

			types.shift();

			if (types) {
				for (const type of types) {
					const t = type.trim().split("(")[0]?.trim();

					if (!t) continue;

					const v = t.split(" as ");

					if (v.length > 1) {
						console.log(`DROP TYPE ${v[0]} done!`);
						await pool.query(`DROP TYPE IF EXISTS ${v[0]} CASCADE`);
					} else {
						console.log(`DROP TYPE ${t[0]} done!`);
						await pool.query(`DROP TYPE IF EXISTS ${t[0]} CASCADE`);
					}
				}
			}

			const sequences = sql
				.toLowerCase()
				.replace(/[^a-z0-9,()_; ]/g, " ")
				.replace(/  +/g, " ")
				.trim()
				.split("create sequence");

			sequences.shift();

			if (sequences) {
				for (const sequence of sequences) {
					const s = sequence.trim().split(" ")[0]?.trim();

					if (!s) continue;

					await pool.query(`DROP SEQUENCE IF EXISTS ${s} CASCADE`);
					console.log(`DROP SEQUENCE ${s} done!`);
				}
			}
		}

		await pool.query(`DROP TABLE IF EXISTS ${settings.migrationsTableName} CASCADE`);
		console.log(`DROP TABLE ${settings.migrationsTableName} done!`);

		console.log("All done!");
	} catch (error) {
		return console.log(error);
	}
}
