import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseViewModel } from "../model/index.js";

type BaseDomainGeneric = {
	CoreFields: SharedTypes.TRawParams;
	Model: BaseViewModel;
};

/**
 * @experimental
 */
export class BaseViewDomain<TC extends BaseDomainGeneric> {
	#name;
	#coreFields;

	model;

	constructor(data: Types.TDomain<TC["Model"]>) {
		if (!(data.model instanceof BaseViewModel)) {
			throw new Error("You need pass extended of BaseViewModel");
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
		getArrByParams: <T extends keyof TC["CoreFields"]>(options: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: { orderBy: Extract<keyof TC["CoreFields"], string>; ordering: SharedTypes.TOrdering; }[];
		}) => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),
		getCountByParams: (options: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
		}) => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof TC["CoreFields"]>(options: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
	};

	async getArrByParams<T extends keyof TC["CoreFields"]>(options: {
		params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: { orderBy: Extract<keyof TC["CoreFields"], string>; ordering: SharedTypes.TOrdering; }[];
	}): Promise<Array<Pick<TC["CoreFields"], T>>> {
		return this.model.getArrByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	async getCountByParams(options: {
		params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	async getOneByParams<T extends keyof TC["CoreFields"]>(options: {
		params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<TC["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.name}` };

		return { one };
	}
}
