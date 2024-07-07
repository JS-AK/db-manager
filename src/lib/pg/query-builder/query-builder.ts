import pg from "pg";

import * as DomainTypes from "../domain/types.js";
import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";
import { QueryHandler } from "./query-handler.js";

export class QueryBuilder {
	#tableNameRaw;
	#tableNamePrepared;

	#client;
	#queryHandler;

	constructor(
		tableName: string,
		client: pg.Pool | pg.PoolClient,
		queryHandler?: QueryHandler,
	) {
		this.#tableNameRaw = tableName;

		const chunks = tableName.toLowerCase().split(" ").filter((e) => e && e !== "as");
		const as = chunks[1]?.trim();

		if (as) {
			this.#tableNamePrepared = as;
		} else {
			this.#tableNamePrepared = tableName;
		}

		this.#queryHandler = queryHandler || new QueryHandler({
			tableNamePrepared: this.#tableNamePrepared,
			tableNameRaw: this.#tableNameRaw,
		});

		this.#client = client;
	}

	clone() {
		const main = new QueryHandler(this.#queryHandler.optionsToClone);

		return new QueryBuilder(this.#tableNameRaw, this.#client, main);
	}

	compareQuery(): { query: string; values: unknown[]; } {
		return this.#queryHandler.compareQuery();
	}

	delete() {
		this.#queryHandler.delete();

		return this;
	}

	insert<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T | T[];
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		this.#queryHandler.insert<T>(options);

		return this;
	}

	update<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T;
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		this.#queryHandler.update<T>(options);

		return this;
	}

	select(data: string[]) {
		this.#queryHandler.select(data);

		return this;
	}

	rawJoin(data: string) {
		this.#queryHandler.rawJoin(data);

		return this;
	}

	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.rightJoin(data);

		return this;
	}

	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.leftJoin(data);

		return this;
	}

	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.innerJoin(data);

		return this;
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#queryHandler.fullOuterJoin(data);

		return this;
	}

	where<T extends ModelTypes.TSearchParams>(data: {
		params?: ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>>;
	}) {
		this.#queryHandler.where(data);

		return this;
	}

	rawWhere(data: string) {
		this.#queryHandler.rawWhere(data);

		return this;
	}

	pagination(data: { limit: number; offset: number; }) {
		this.#queryHandler.pagination(data);

		return this;
	}

	orderBy(data: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]) {
		this.#queryHandler.orderBy(data);

		return this;
	}

	groupBy(data: string[]) {
		this.#queryHandler.groupBy(data);

		return this;
	}

	having<T extends ModelTypes.TSearchParams>(data: {
		params?: ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams | DomainTypes.TSearchParams<T>>;
	}) {
		this.#queryHandler.having(data);

		return this;
	}

	rawHaving(data: string) {
		this.#queryHandler.rawHaving(data);

		return this;
	}

	returning(data: string[]) {
		this.#queryHandler.returning(data);

		return this;
	}

	async execute<T extends pg.QueryResultRow>() {
		const sql = this.compareQuery();

		return (await this.#client.query<T>(sql.query, sql.values)).rows;
	}
}
