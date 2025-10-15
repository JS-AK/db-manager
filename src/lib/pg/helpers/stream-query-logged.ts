import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

import PgQueryStream from "pg-query-stream";
import pg from "pg";

import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";

function setupStreamWatchdog(
	stream: Readable,
	timeoutValues: { clientTimeout?: number; connTimeout?: number; },
): () => void {
	const { clientTimeout, connTimeout } = timeoutValues;

	let timeoutMs: number | undefined;
	let timeoutSource: "client" | "connection" | undefined;

	if (typeof clientTimeout === "number" && clientTimeout > 0) {
		timeoutMs = clientTimeout;
		timeoutSource = "client";
	} else if (typeof connTimeout === "number" && connTimeout > 0) {
		timeoutMs = connTimeout;
		timeoutSource = "connection";
	}

	const watchdog = typeof timeoutMs === "number" && timeoutMs > 0
		? setTimeout(() => {
			if (!stream.destroyed) {
				let message = `Stream query timeout: first chunk not received in time ${timeoutMs}ms.`;

				if (timeoutSource === "client") {
					message += ` Client timeout: ${timeoutMs}ms.`;
				} else if (timeoutSource === "connection") {
					message += ` Connection timeout: ${timeoutMs}ms.`;
				}

				stream.destroy(new Error(message));
			}
		}, timeoutMs)
		: undefined;

	const clearWatchdog = () => {
		if (watchdog) clearTimeout(watchdog);
	};

	stream.once("data", clearWatchdog);

	return clearWatchdog;
}

async function runStreamQuery(
	executor: ModelTypes.TExecutor,
	streamQuery: PgQueryStream,
): Promise<Readable> {
	if (executor instanceof pg.Pool) {
		const client = await executor.connect();
		// Temporarily disable client-side query_timeout to avoid pg-query-stream callback error
		// Ref: node-postgres issue #1860
		const clientAny = client as unknown as { query_timeout?: number; connectionParameters?: { query_timeout?: number; }; };
		const prevClientQueryTimeout: number | undefined = clientAny.query_timeout;
		const prevConnQueryTimeout: number | undefined = clientAny.connectionParameters?.query_timeout;

		if (
			typeof prevClientQueryTimeout === "number"
			&& prevClientQueryTimeout > 0
		) {
			clientAny.query_timeout = 0;
		}

		if (
			typeof prevConnQueryTimeout === "number"
			&& prevConnQueryTimeout > 0
			&& clientAny.connectionParameters
		) {
			clientAny.connectionParameters.query_timeout = 0;
		}

		const stream = client.query(streamQuery);

		const clearWatchdog = setupStreamWatchdog(
			stream,
			{ clientTimeout: prevClientQueryTimeout, connTimeout: prevConnQueryTimeout },
		);

		let isReleased = false;

		const cleanupAndRelease = () => {
			// restore timeouts idempotently
			if (typeof prevClientQueryTimeout === "number") {
				clientAny.query_timeout = prevClientQueryTimeout;
			}
			if (typeof prevConnQueryTimeout === "number" && clientAny.connectionParameters) {
				clientAny.connectionParameters.query_timeout = prevConnQueryTimeout;
			}

			clearWatchdog();

			if (!isReleased) {
				isReleased = true;
				client.release();
			}
		};

		stream.once("end", cleanupAndRelease);
		stream.once("error", cleanupAndRelease);
		stream.once("close", cleanupAndRelease);

		return stream;
	} else {
		// Handle direct Client or externally managed PoolClient
		const directClient = executor as unknown as {
			query: (q: PgQueryStream) => Readable;
			query_timeout?: number;
			connectionParameters?: { query_timeout?: number; };
		};
		const prevClientQueryTimeout: number | undefined = directClient.query_timeout;
		const prevConnQueryTimeout: number | undefined = directClient.connectionParameters?.query_timeout;

		if (
			typeof prevClientQueryTimeout === "number"
			&& prevClientQueryTimeout > 0
		) {
			directClient.query_timeout = 0;
		}

		if (
			typeof prevConnQueryTimeout === "number"
			&& prevConnQueryTimeout > 0
			&& directClient.connectionParameters
		) {
			directClient.connectionParameters.query_timeout = 0;
		}

		const stream = directClient.query(streamQuery);

		const clearWatchdog = setupStreamWatchdog(
			stream,
			{ clientTimeout: prevClientQueryTimeout, connTimeout: prevConnQueryTimeout },
		);

		const restoreClientTimeout = () => {
			if (typeof prevClientQueryTimeout === "number") {
				directClient.query_timeout = prevClientQueryTimeout;
			}

			if (typeof prevConnQueryTimeout === "number" && directClient.connectionParameters) {
				directClient.connectionParameters.query_timeout = prevConnQueryTimeout;
			}

			clearWatchdog();
		};

		stream.once("end", restoreClientTimeout);
		stream.once("error", restoreClientTimeout);
		stream.once("close", restoreClientTimeout);

		return stream;
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
