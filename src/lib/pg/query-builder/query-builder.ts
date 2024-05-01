import pg from "pg";

import * as DomainTypes from "../domain/types.js";
import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";
import { QueryBuilderMain } from "./query-builder-main.js";

export class QueryBuilder {
	#tableNameRaw;
	#tableName;

	#client;
	#main;

	constructor(
		tableName: string,
		client: pg.Pool | pg.PoolClient,
		queryBuilderMain?: QueryBuilderMain,
	) {
		this.#tableNameRaw = tableName;

		const chunks = tableName.toLowerCase().split(" ").filter((e) => e && e !== "as");
		const as = chunks[1]?.trim();

		if (as) {
			this.#tableName = as;
		} else {
			this.#tableName = tableName;
		}

		this.#main = queryBuilderMain || new QueryBuilderMain({
			tableName: this.#tableName,
			tableNameRaw: this.#tableNameRaw,
		});

		this.#client = client;
	}

	clone() {
		const main = new QueryBuilderMain(this.#main.optionsToClone);

		return new QueryBuilder(this.#tableNameRaw, this.#client, main);
	}

	compareQuery(): { query: string; values: unknown[]; } {
		return this.#main.compareQuery();
	}

	delete() {
		this.#main.delete();

		return this;
	}

	insert<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T | T[];
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		this.#main.insert<T>(options);

		return this;
	}

	update<T extends SharedTypes.TRawParams = SharedTypes.TRawParams>(options: {
		onConflict?: string;
		params: T;
		updateColumn?: { title: string; type: "unix_timestamp" | "timestamp"; } | null;
	}) {
		this.#main.update<T>(options);

		return this;
	}

	select(data: string[]) {
		this.#main.select(data);

		return this;
	}

	rawJoin(data: string) {
		this.#main.rawJoin(data);

		return this;
	}

	rightJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#main.rightJoin(data);

		return this;
	}

	leftJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#main.leftJoin(data);

		return this;
	}

	innerJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#main.innerJoin(data);

		return this;
	}

	fullOuterJoin(data: {
		targetTableName: string;
		targetTableNameAs?: string;
		targetField: string;
		initialTableName?: string;
		initialField: string;
	}) {
		this.#main.fullOuterJoin(data);

		return this;
	}

	where(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		this.#main.where(data);

		return this;
	}

	rawWhere(data: string) {
		this.#main.rawWhere(data);

		return this;
	}

	pagination(data: { limit: number; offset: number; }) {
		this.#main.pagination(data);

		return this;
	}

	orderBy(data: {
		column: string;
		sorting: SharedTypes.TOrdering;
	}[]) {
		this.#main.orderBy(data);

		return this;
	}

	groupBy(data: string[]) {
		this.#main.groupBy(data);

		return this;
	}

	having(data: {
		params?: ModelTypes.TSearchParams;
		paramsOr?: DomainTypes.TArray2OrMore<ModelTypes.TSearchParams>;
	}) {
		this.#main.having(data);

		return this;
	}

	returning(data: string[]) {
		this.#main.returning(data);

		return this;
	}

	async execute<T extends pg.QueryResultRow>() {
		const sql = this.compareQuery();

		return (await this.#client.query<T>(sql.query, sql.values)).rows;
	}
}
