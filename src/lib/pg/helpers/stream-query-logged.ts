import { Readable } from "node:stream";

import PgQueryStream from "pg-query-stream";
import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import { TExecutor } from "../model/types.js";

async function runStreamQuery(executor: TExecutor, streamQuery: PgQueryStream): Promise<Readable> {
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
		client: TExecutor;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values?: unknown[],
): Promise<Readable> {
	const start = performance.now();

	const streamQuery = new PgQueryStream(query, values);

	const stream = await runStreamQuery(this.client, streamQuery);

	let ended = false;

	const onFinish = () => {
		if (ended) return;
		ended = true;

		const execTime = Math.round(performance.now() - start);

		this.logger.info(`Stream query finished in ${execTime} ms. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);
	};

	const onError = (error: Error) => {
		if (ended) return;
		ended = true;

		const execTime = Math.round(performance.now() - start);

		this.logger.error(`Stream query failed in ${execTime} ms. QUERY: ${query} VALUES: ${JSON.stringify(values)} ERROR: ${error.message}`);
	};

	stream.once("end", onFinish);
	stream.once("error", onError);

	this.logger.info(`Stream query started. QUERY: ${query} VALUES: ${JSON.stringify(values)}`);

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
				const streamQuery = new PgQueryStream(sql.query, sql.values);

				return runStreamQuery(executor, streamQuery);
			},
		};
	}
}
