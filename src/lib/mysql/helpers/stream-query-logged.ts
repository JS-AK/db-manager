import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

import { PoolConnection as RawPoolConnection } from "mysql2";
import mysql from "mysql2/promise";

import * as SharedTypes from "../../../shared-types/index.js";
import { TExecutor } from "../model/types.js";

function isPool(conn: unknown): conn is mysql.Pool {
	return typeof conn === "object" && conn !== null && "getConnection" in conn;
}

function isPoolConnection(conn: unknown): conn is mysql.PoolConnection {
	return typeof conn === "object" && conn !== null && "release" in conn && "connection" in conn;
}

function isRawConnection(conn: unknown): conn is RawPoolConnection {
	return typeof conn === "object" && conn !== null && "query" in conn;
}

async function runStreamQuery(
	executor: TExecutor,
	query: string,
	values?: unknown[],
): Promise<Readable> {
	if (isPool(executor)) {
		const promiseConn = await executor.getConnection();

		try {
			const rawConn = promiseConn.connection as unknown as RawPoolConnection;
			const stream = rawConn.query(query, values).stream();

			stream.once("end", () => promiseConn.release());
			stream.once("error", () => promiseConn.release());

			return stream;
		} catch (err) {
			promiseConn.release();
			throw err;
		}
	} else if (isPoolConnection(executor)) {
		const rawConn = executor.connection as unknown as RawPoolConnection;

		return rawConn.query(query, values).stream();
	} else if (isRawConnection(executor)) {
		return (executor as RawPoolConnection).query(query, values).stream();
	} else {
		throw new Error("Invalid mysql executor");
	}
}

async function streamQueryLogged(
	this: {
		client: TExecutor;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values?: unknown[],
): Promise<Readable> {
	const queryId = randomUUID();
	const start = performance.now();

	let stream: Readable;

	this.logger.info(`[${queryId}] Stream query started. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);

	try {
		stream = await runStreamQuery(this.client, query, values);
	} catch (error) {
		const execTime = Math.round(performance.now() - start);

		this.logger.error(`[${queryId}] Stream query failed during start in ${execTime} ms. ERROR: ${(error as Error).message}`);

		throw error;
	}

	let ended = false;

	const finalize = (level: "info" | "error", message: string) => {
		if (ended) return;

		ended = true;

		const execTime = Math.round(performance.now() - start);

		this.logger[level](`[${queryId}] ${message} in ${execTime} ms.`);
	};

	stream.once("end", () => finalize("info", "Stream query finished"));

	stream.once("error", (err: Error) => {
		finalize("error", `Stream query failed with error: ${err.message}`);

		if (!stream.destroyed) stream.destroy(err);
	});

	return stream;
}

export function setStreamExecutor(
	executor: TExecutor,
	options?: {
		isLoggerEnabled?: boolean;
		logger?: SharedTypes.TLogger;
	},
) {
	const { isLoggerEnabled, logger } = options || {};

	if (isLoggerEnabled) {
		// eslint-disable-next-line no-console
		const resultLogger = logger || { error: console.error, info: console.log };

		return {
			executeSqlStream: async (sql: {
				query: string;
				values?: unknown[];
			}): Promise<Readable> => {
				return streamQueryLogged.bind({ client: executor, logger: resultLogger })(sql.query, sql.values);
			},
		};
	} else {
		return {
			executeSqlStream: async (sql: {
				query: string;
				values?: unknown[];
			}): Promise<Readable> => {
				return runStreamQuery(executor, sql.query, sql.values);
			},
		};
	}
}
