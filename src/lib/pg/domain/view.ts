import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseView as Model } from "../model/index.js";

type ConditionalDomainFieldsType<First, Second> = First extends Types.TDomainFields ? First : Partial<Second>;

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

	compareQuery = {
		getArrByParams: <T extends keyof BVG["CoreFields"]>(options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BVG["CoreFields"], string> | (BVG["AdditionalSortingFields"] extends string ? BVG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}) => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),
		getCountByParams: (options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
		}) => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof BVG["CoreFields"]>(options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
	};

	async getArrByParams<T extends keyof BVG["CoreFields"]>(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination; order?: {
			orderBy: Extract<keyof BVG["CoreFields"], string> | (BVG["AdditionalSortingFields"] extends string ? BVG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<BVG["CoreFields"], T>>> {
		return this.model.getArrByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	async getCountByParams(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	async getOneByParams<T extends keyof BVG["CoreFields"]>(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BVG["SearchFields"], BVG["CoreFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<BVG["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.name}` };

		return { one };
	}
}
