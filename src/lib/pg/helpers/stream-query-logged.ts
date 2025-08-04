import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

import PgQueryStream from "pg-query-stream";
import pg from "pg";

import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";

async function runStreamQuery(
	executor: ModelTypes.TExecutor,
	streamQuery: PgQueryStream,
): Promise<Readable> {
	if (executor instanceof pg.Pool) {
		const client = await executor.connect();

		const stream = client.query(streamQuery);

		stream.once("end", () => client.release());
		stream.once("error", () => client.release());

		return stream;
	} else {
		return executor.query(streamQuery);
	}
}

async function streamQueryLogged(
	this: {
		client: ModelTypes.TExecutor;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values?: unknown[],
	config?: ModelTypes.StreamOptions,
): Promise<Readable> {
	const queryId = randomUUID();
	const start = performance.now();
	const streamQuery = new PgQueryStream(query, values, config);

	let stream: Readable;

	this.logger.info(`[${queryId}] Stream query started. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);

	try {
		stream = await runStreamQuery(this.client, streamQuery);
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
	executor: ModelTypes.TExecutor,
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
			executeSqlStream: async (
				sql: { query: string; values?: unknown[]; },
				config?: ModelTypes.StreamOptions,
			): Promise<Readable> => {
				return streamQueryLogged.bind({ client: executor, logger: resultLogger })(sql.query, sql.values, config);
			},
		};
	} else {
		return {
			executeSqlStream: async (
				sql: { query: string; values?: unknown[]; },
				config?: ModelTypes.StreamOptions,
			): Promise<Readable> => {
				const streamQuery = new PgQueryStream(sql.query, sql.values, config);

				return runStreamQuery(executor, streamQuery);
			},
		};
	}
}
