import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseModel } from "../model/index.js";

export class BaseDomain<
	CreateFields extends SharedTypes.TRawParams,
	SearchFields extends Types.TDomainFields,
	TableFields extends SharedTypes.TRawParams,
	UpdateFields extends SharedTypes.TRawParams,
> {
	model;

	constructor(data: Types.TDomain<BaseModel>) {
		if (!(data.model instanceof BaseModel)) {
			throw new Error("You need pass extended of PG.");
		}

		this.model = data.model;
	}

	async createOne(createFields: CreateFields): Promise<TableFields> {
		const res = await this.model.save(createFields);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	async deleteOneByPk(pk: string): Promise<string> {
		return this.model.delete(pk);
	}

	async deleteAll(): Promise<string[]> {
		return this.model.deleteAll();
	}

	async getArrByParams({ params, paramsOr, selected = ["*"], pagination, orderBy, ordering }: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: string[];
		pagination?: SharedTypes.TPagination;
		orderBy?: string;
		ordering?: SharedTypes.TOrdering;
	}): Promise<TableFields[]> {
		return this.model.getArrByParams(
			{ $and: params, $or: paramsOr },
			selected,
			pagination,
			orderBy,
			ordering,
		);
	}

	async getCountByPks(pks: string[]): Promise<number> {
		return this.model.getCountByPks(pks);
	}

	async getCountByPksAndParams(
		pks: string[],
		{ params, paramsOr }: {
			params: Types.TSearchParams<SearchFields>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		},
	): Promise<number> {
		return this.model.getCountByPksAndParams(pks, { $and: params, $or: paramsOr });
	}

	async getCountByParams({ params, paramsOr }: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: params, $or: paramsOr });
	}

	async getGuaranteedOneByParams({ params, paramsOr, selected = ["*"] }: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: string[];
	}): Promise<TableFields> {
		return this.model.getOneByParams(
			{ $and: params, $or: paramsOr },
			selected,
		);
	}

	async getOneByParams({ params, paramsOr, selected = ["*"] }: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: string[];
	}): Promise<{ message?: string; one?: TableFields; }> {
		const one = await this.model.getOneByParams({ $and: params, $or: paramsOr }, selected);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async getOneByPk(pk: string): Promise<{ message?: string; one?: TableFields; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async updateOneByPk(pk: string, params: UpdateFields): Promise<TableFields> {
		return this.model.update(pk, params);
	}
}
