import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseMaterializedView as Model } from "../model/index.js";

export type BaseMaterializedViewGeneric = {
	AdditionalSortingFields?: string;
	CoreFields: SharedTypes.TRawParams;
};

/**
 * @experimental
 */
export class BaseMaterializedView<
	M extends Model = Model,
	BMVG extends BaseMaterializedViewGeneric = BaseMaterializedViewGeneric
> {
	#name;
	#coreFields;

	model;

	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of PG.Model.BaseMaterializedView");
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
		getArrByParams: <T extends keyof BMVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Partial<BMVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<BMVG["CoreFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BMVG["CoreFields"], string> | (BMVG["AdditionalSortingFields"] extends string ? BMVG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}) => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),
		getCountByParams: (options: {
			params: Types.TSearchParams<Partial<BMVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<BMVG["CoreFields"]>>>;
		}) => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof BMVG["CoreFields"]>(options: {
			params: Types.TSearchParams<Partial<BMVG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<BMVG["CoreFields"]>>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
	};

	async getArrByParams<T extends keyof BMVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Partial<BMVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<BMVG["CoreFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof BMVG["CoreFields"], string> | (BMVG["AdditionalSortingFields"] extends string ? BMVG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<BMVG["CoreFields"], T>>> {
		return this.model.getArrByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	async getCountByParams(options: {
		params: Types.TSearchParams<Partial<BMVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<BMVG["CoreFields"]>>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	async getOneByParams<T extends keyof BMVG["CoreFields"]>(options: {
		params: Types.TSearchParams<Partial<BMVG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<BMVG["CoreFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<BMVG["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.name}` };

		return { one };
	}

	async refresh(): Promise<void> {
		return this.model.refresh();
	}
}
