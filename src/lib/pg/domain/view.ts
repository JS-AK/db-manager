import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseView as Model } from "../model/index.js";

type BaseViewGeneric = {
	AdditionalSortingFields?: string;
	CoreFields: SharedTypes.TRawParams;
	SearchFields?: Types.TDomainFields;
};

/**
 * @experimental
 */
export class BaseView<
	M extends Model = Model,
	BVG extends BaseViewGeneric = BaseViewGeneric
> {
	#name;
	#coreFields;

	/**
	 * The model associated with this domain.
	 */
	model;

	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of PG.Model.BaseView");
		}

		this.model = data.model;

		this.#name = this.model.name;
		this.#coreFields = this.model.coreFields;
	}

	get name() {
		return this.#name;
	}

	get coreFields() {
		return this.#coreFields;
	}

	/**
	 * Compare query operations for the table.
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
		getArrByParams: <T extends keyof BVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BVG["CoreFields"], string> | (BVG["AdditionalSortingFields"] extends string ? BVG["AdditionalSortingFields"] : never);
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
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
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
		getOneByParams: <T extends keyof BVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
			selected?: [T, ...T[]];
		}): Types.TCompareQueryResult => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
	};

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
	async getArrByParams<T extends keyof BVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination; order?: {
			orderBy: Extract<keyof BVG["CoreFields"], string> | (BVG["AdditionalSortingFields"] extends string ? BVG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<BVG["CoreFields"], T>>> {
		return this.model.getArrByParams<Pick<BVG["CoreFields"], T>>(
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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
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
	async getOneByParams<T extends keyof BVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<BVG["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams<Pick<BVG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.name}` };

		return { one };
	}
}
