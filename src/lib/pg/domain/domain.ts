import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseModel } from "../model/index.js";

export class BaseDomain<
	Model extends BaseModel,
	CreateFields extends SharedTypes.TRawParams,
	SearchFields extends Types.TDomainFields,
	TableFields extends SharedTypes.TRawParams,
	UpdateFields extends SharedTypes.TRawParams,
> {
	#createField;
	#primaryKey;
	#tableName;
	#tableFields;
	#updateField;

	model;

	constructor(data: Types.TDomain<Model>) {
		if (!(data.model instanceof BaseModel)) {
			throw new Error("You need pass extended of PG.");
		}

		this.model = data.model;

		this.#createField = this.model.createField;
		this.#primaryKey = this.model.primaryKey;
		this.#tableName = this.model.tableName;
		this.#tableFields = this.model.tableFields;
		this.#updateField = this.model.updateField;
	}

	get createField() {
		return this.#createField;
	}

	get primaryKey() {
		return this.#primaryKey;
	}

	get tableName() {
		return this.#tableName;
	}

	get tableFields() {
		return this.#tableFields;
	}

	get updateField() {
		return this.#updateField as keyof TableFields;
	}

	async createOne(createFields: CreateFields): Promise<TableFields> {
		const res = await this.model.save(createFields);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async deleteOneByPk<T = string | number>(pk: T): Promise<T | null> {
		return this.model.deleteOneByPk<T>(pk);
	}

	async deleteByParams(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
	}): Promise<null> {
		return this.model.deleteByParams(
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async getArrByParams<T extends keyof TableFields>(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: { orderBy: Extract<keyof TableFields, string>; ordering: SharedTypes.TOrdering; }[];
	}): Promise<Array<Pick<TableFields, T>>> {
		return this.model.getArrByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	async getCountByPks(pks: string[]): Promise<number> {
		return this.model.getCountByPks(pks);
	}

	async getCountByPksAndParams(
		pks: string[],
		options: {
			params: Types.TSearchParams<SearchFields>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		},
	): Promise<number> {
		return this.model.getCountByPksAndParams(
			pks,
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async getCountByParams(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
	}): Promise<number> {
		return this.model.getCountByParams({
			$and: options.params,
			$or: options.paramsOr,
		});
	}

	async getGuaranteedOneByParams<T extends keyof TableFields>(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: [T, ...T[]];
	}): Promise<Pick<TableFields, T>> {
		return this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);
	}

	async getOneByParams<T extends keyof TableFields>(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<TableFields, T>; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async getOneByPk(pk: string): Promise<{ message?: string; one?: TableFields; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async updateByParams(
		options: {
			params: Types.TSearchParams<SearchFields>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		},
		params: UpdateFields,
	): Promise<TableFields[]> {
		return this.model.updateByParams(
			{ $and: options.params, $or: options.paramsOr },
			params,
		);
	}

	async updateOneByPk(pk: string, params: UpdateFields): Promise<TableFields> {
		return this.model.updateOneByPk(pk, params);
	}
}
