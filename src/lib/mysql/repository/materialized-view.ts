import * as ModelTypes from "../model/types.js";
import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "../domain/types.js";
import {
	BaseMaterializedView as Model,
	StreamOptions,
	TExecutor,
} from "../model/index.js";
import { QueryBuilder } from "../query-builder/query-builder.js";

import { BaseMaterializedViewGeneric as MaterializedViewGeneric } from "../domain/materialized-view.js";

/**
 * A class representing a base materialized view with generic type parameters for handling database operations.
 *
 * @experimental
 */
export class MaterializedView<MVG extends MaterializedViewGeneric = MaterializedViewGeneric> {
	#name;
	#coreFields;

	#initialArgs;

	/**
	 * The model associated with this domain.
	 */
	#model;

	/**
	 * Initializes a new instance of the `MaterializedView` class.
	 *
	 * Wraps a {@link Model} instance based on the provided materialized view schema definition,
	 * allowing structured access to materialized view metadata and behavior.
	 *
	 * @param config - Configuration object for initializing the materialized view.
	 * @param config.schema - Definition of the materialized view structure, including:
	 *   - `name`: The name of the materialized view.
	 *   - `coreFields`: Array of field names in the materialized view.
	 *   - `additionalSortingFields`: (optional) Fields used for secondary sorting.
	 * @param [config.client] - Optional custom executor (e.g., `pg.PoolClient`) to handle queries manually.
	 * @param [config.dbCreds] - Database connection credentials, used if `client` is not provided:
	 *   - `host`, `port`, `user`, `password`, `database`.
	 * @param [config.options] - Additional model options:
	 *   - Any other supported `Model`-level configuration excluding direct `client`.
	 *
	 * @throws {Error} If neither `client` nor `dbCreds` are provided, or if schema is invalid.
	 */
	constructor(config: {
		client?: TExecutor;
		dbCreds?: ModelTypes.TDBCreds;
		options?: ModelTypes.TMVOptionsWithoutClient;
		schema: ModelTypes.TMaterializedView<SharedTypes.TStringKeys<MVG["CoreFields"]>[]>;
	}) {
		this.#initialArgs = structuredClone(config);

		this.#model = new Model(config.schema, config.dbCreds, config.options);

		this.#name = this.#model.name;
		this.#coreFields = this.#model.coreFields;
	}

	/**
	 * Gets the name of the database materialized view.
	 *
	 * @returns The name of the materialized view.
	 */
	get name() {
		return this.#name;
	}

	/**
	 * Gets the fields of the database materialized view.
	 *
	 * @returns An array of field names in the materialized view.
	 */
	get coreFields() {
		return this.#coreFields;
	}

	/**
	 * Gets the internal model object associated with this materialized view.
	 *
	 * This provides access to the underlying model methods and fields.
	 *
	 * @returns The internal model object.
	 */
	get model() {
		return this.#model;
	}

	/**
	 * Compare query operations for the materialized view.
	 */
	compareQuery = {

		/**
		 * Compare query of `Retrieves an array of records based on the specified search parameters`.
		 *
		 * @param options - The options for retrieving records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [options.selected] - The fields to return for each matched record.
		 * @param [options.pagination] - The pagination options.
		 * @param [options.order] - The sorting options.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		getArrByParams: <T extends keyof MVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof MVG["CoreFields"], string> | (MVG["AdditionalSortingFields"] extends string ? MVG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}): Types.TCompareQueryResult => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),

		/**
		 * Compare query of `Gets the count of records that match the specified search parameters`.
		 *
		 * @param options - The options for filtering records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		getCountByParams: (options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
		}): Types.TCompareQueryResult => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),

		/**
		 * Compare query of `Retrieves a single record based on the specified search parameters`.
		 *
		 * @param options - The options for retrieving the record.
		 * @param options.params - The search parameters to match the record.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [options.selected] - The fields to return for the matched record.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		getOneByParams: <T extends keyof MVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
			selected?: [T, ...T[]];
		}): Types.TCompareQueryResult => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),

		/**
		 * Constructs a SQL stream query for selecting records based on the provided search parameters.
		 * This version is optimized for large datasets where streaming is preferred over loading everything into memory.
		 *
		 * @param options - The options for retrieving records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [options.selected] - The fields to return for each matched record.
		 * @param [options.pagination] - The pagination options.
		 * @param [options.order] - The sorting options.
		 *
		 * @returns The SQL query and its parameter values for use with a streaming interface.
		 */
		streamArrByParams: <T extends keyof MVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof MVG["CoreFields"], string> | (MVG["AdditionalSortingFields"] extends string ? MVG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}): Types.TCompareQueryResult => this.model.compareQuery.streamArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),

	};

	/**
	 * Sets the client in the current class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the current class with the updated client.
	 */
	setupClient(client: TExecutor): this {
		return new (this.constructor as new (config: {
			client?: TExecutor;
			dbCreds?: ModelTypes.TDBCreds;
			options?: ModelTypes.TMVOptionsWithoutClient;
			schema: ModelTypes.TMaterializedView<SharedTypes.TStringKeys<MVG["CoreFields"]>[]>;
		}) => this)({
			client,
			dbCreds: this.#initialArgs.dbCreds,
			options: this.#initialArgs.options,
			schema: this.#initialArgs.schema,
		});
	}

	/**
	 * Retrieves an array of records based on the specified search parameters.
	 *
	 * @param options - The options for retrieving records.
	 * @param options.params - The search parameters to match records.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param [options.selected] - The fields to return for each matched record.
	 * @param [options.pagination] - The pagination options.
	 * @param [options.order] - The sorting options.
	 * @param options.order.orderBy - The field by which to sort the results.
	 * @param options.order.ordering - The ordering direction (e.g., ASC, DESC).
	 *
	 * @returns A promise that resolves to an array of records with the selected fields.
	 */
	async getArrByParams<T extends keyof MVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof MVG["CoreFields"], string> | (MVG["AdditionalSortingFields"] extends string ? MVG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<MVG["CoreFields"], T>>> {
		return this.model.getArrByParams<Pick<MVG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	/**
	 * Gets the count of records that match the specified search parameters.
	 *
	 * @param options - The options for filtering records.
	 * @param options.params - The search parameters to match records.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 *
	 * @returns A promise that resolves to the number of matching records.
	 */
	async getCountByParams(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	/**
	 * Retrieves a single record based on the specified search parameters.
	 *
	 * @param options - The options for retrieving the record.
	 * @param options.params - The search parameters to match the record.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param [options.selected] - The fields to return for the matched record.
	 *
	 * @returns A promise that resolves to an object containing either a message (if not found) or the matched record.
	 */
	async getOneByParams<T extends keyof MVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<MVG["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams<Pick<MVG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.name}` };

		return { one };
	}

	/**
	 * Refreshes the materialized view.
	 *
	 * @param [concurrently=false] - Whether to refresh the view concurrently.
	 *
	 * @returns A promise that resolves when the view is refreshed.
	 */
	async refresh(concurrently: boolean = false): Promise<void> {
		return this.model.refresh(concurrently);
	}

	/**
	 * Streams records from the database based on the specified search parameters.
	 *
	 * This method returns a readable stream of records that match the given filter conditions.
	 * Useful for efficiently processing large datasets without loading them entirely into memory.
	 *
	 * @param options - The options for retrieving records.
	 * @param options.params - The search parameters to match all (AND condition).
	 * @param [options.paramsOr] - An optional array of search parameters where at least one must match (OR condition).
	 * @param [options.selected] - The list of fields to include in each returned record.
	 * @param [options.pagination] - The pagination options to control result limits and offsets.
	 * @param [options.order] - The sorting rules for the result set.
	 * @param options.order[].orderBy - The field to sort by.
	 * @param options.order[].ordering - The sorting direction (`ASC` or `DESC`).
	 *
	 * @param [streamOptions] - Optional stream configuration:
	 * - `highWaterMark`: The max number of records buffered in the stream.
	 * - `objectMode`: If `true`, the stream operates in object mode (default for object streams).
	 *
	 * @returns A readable stream emitting records of type `Pick<VG["CoreFields"], T>` on the `"data"` event.
	 */
	async streamArrByParams<T extends keyof MVG["CoreFields"]>(
		options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<MVG["SearchFields"], MVG["CoreFields"]>>[];
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof MVG["CoreFields"], string> | (MVG["AdditionalSortingFields"] extends string ? MVG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		},
		streamOptions?: StreamOptions,
	): Promise<SharedTypes.ITypedPgStream<Pick<MVG["CoreFields"], T>>> {
		return this.model.streamArrByParams<Pick<MVG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
			streamOptions,
		);
	}

	queryBuilder(options?: {
		client?: TExecutor;
		isLoggerEnabled?: boolean;
		logger?: SharedTypes.TLogger;
		tableName?: string;
	}): QueryBuilder {
		return this.#model.queryBuilder(options);
	}
}
