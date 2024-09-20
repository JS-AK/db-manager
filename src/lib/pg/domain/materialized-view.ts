import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseMaterializedView as Model } from "../model/index.js";

export type BaseMaterializedViewGeneric = {
	AdditionalSortingFields?: string;
	CoreFields: SharedTypes.TRawParams;
	SearchFields?: Types.TDomainFields;
};

/**
 * A class representing a base materialized view with generic type parameters for handling database operations.
 *
 * @experimental
 */
export class BaseMaterializedView<
	M extends Model = Model,
	BMVG extends BaseMaterializedViewGeneric = BaseMaterializedViewGeneric
> {
	#name;
	#coreFields;

	/**
	 * The model associated with this domain.
	 */
	model;

	/**
	 * Initializes a new instance of the `BaseMaterializedView` class.
	 *
	 * @param data - The domain data object containing the model.
	 *
	 * @throws {Error} If `data.model` is not an instance of `Model`.
	 */
	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of PG.Model.BaseMaterializedView");
		}

		this.model = data.model;

		this.#name = this.model.name;
		this.#coreFields = this.model.coreFields;
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
		getArrByParams: <T extends keyof BMVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>[];
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BMVG["CoreFields"], string> | (BMVG["AdditionalSortingFields"] extends string ? BMVG["AdditionalSortingFields"] : never);
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
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>[];
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
		getOneByParams: <T extends keyof BMVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>[];
			selected?: [T, ...T[]];
		}): Types.TCompareQueryResult => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
	};

	/**
	 * Sets the pool client in the current class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the current class with the updated client.
	 */
	setClientInCurrentClass(client: pg.Pool | pg.PoolClient | pg.Client): this {
		return new (this.constructor as new (data: Types.TDomain<M>) => this)({
			model: this.model.setClientInCurrentClass(client),
		});
	}

	/**
	 * Sets the pool client in the base class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the BaseMaterializedView class with the updated client.
	 */
	setClientInBaseClass(client: pg.Pool | pg.PoolClient | pg.Client): BaseMaterializedView<Model, BMVG> {
		return new BaseMaterializedView({ model: this.model.setClientInBaseClass(client) });
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
	async getArrByParams<T extends keyof BMVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>[];
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof BMVG["CoreFields"], string> | (BMVG["AdditionalSortingFields"] extends string ? BMVG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<BMVG["CoreFields"], T>>> {
		return this.model.getArrByParams<Pick<BMVG["CoreFields"], T>>(
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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>[];
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
	async getOneByParams<T extends keyof BMVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BMVG["SearchFields"], BMVG["CoreFields"]>>[];
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<BMVG["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams<Pick<BMVG["CoreFields"], T>>(
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
}
