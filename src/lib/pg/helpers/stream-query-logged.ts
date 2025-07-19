import { Readable } from "node:stream";

import PgQueryStream from "pg-query-stream";

import * as SharedTypes from "../../../shared-types/index.js";
import { TExecutor } from "../model/types.js";

function streamQueryLogged(
	this: {
		client: TExecutor;
		logger: SharedTypes.TLogger;
	},
	query: string,
	values?: unknown[],
): Readable {
	const start = performance.now();

	const streamQuery = new PgQueryStream(query, values);
	const stream = this.client.query(streamQuery);

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
	pool: TExecutor,
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
			executeSqlStream: (sql: {
				query: string;
				values?: unknown[];
			}): Readable => {
				return streamQueryLogged.bind({ client: pool, logger: resultLogger })(sql.query, sql.values);
			},
		};
	} else {
		return {
			executeSqlStream: (sql: {
				query: string;
				values?: unknown[];
			}): Readable => {
				const streamQuery = new PgQueryStream(sql.query, sql.values);

				return pool.query(streamQuery);
			},
		};
	}
}
