import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseModel } from "../model/index.js";

export class BaseDomain<TC extends {
	Model: BaseModel;
	CreateFields: SharedTypes.TRawParams;
	SearchFields: Types.TDomainFields;
	TableFields: SharedTypes.TRawParams;
	UpdateFields: SharedTypes.TRawParams;
}> {
	#createField;
	#primaryKey;
	#tableName;
	#tableFields;
	#updateField;

	model;

	constructor(data: Types.TDomain<TC["Model"]>) {
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
		return this.#createField as { title: keyof TC["TableFields"]; type: "unix_timestamp" | "timestamp"; } | null;
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
		return this.#updateField as { title: keyof TC["TableFields"]; type: "unix_timestamp" | "timestamp"; } | null;
	}

	async createOne(createFields: TC["CreateFields"]): Promise<TC["TableFields"]> {
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
		params: Types.TSearchParams<TC["SearchFields"]>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
	}): Promise<null> {
		return this.model.deleteByParams(
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async getArrByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<TC["SearchFields"]>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: { orderBy: Extract<keyof TC["TableFields"], string>; ordering: SharedTypes.TOrdering; }[];
	}): Promise<Array<Pick<TC["TableFields"], T>>> {
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
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		},
	): Promise<number> {
		return this.model.getCountByPksAndParams(
			pks,
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async getCountByParams(options: {
		params: Types.TSearchParams<TC["SearchFields"]>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
	}): Promise<number> {
		return this.model.getCountByParams({
			$and: options.params,
			$or: options.paramsOr,
		});
	}

	/**
	 * @deprecated Use getOneByParams
	 */
	async getGuaranteedOneByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<TC["SearchFields"]>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		selected?: [T, ...T[]];
	}): Promise<Pick<TC["TableFields"], T>> {
		return this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);
	}

	async getOneByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<TC["SearchFields"]>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<TC["TableFields"], T>; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async getOneByPk(pk: string): Promise<{ message?: string; one?: TC["TableFields"]; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async updateByParams(
		options: {
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		},
		params: TC["UpdateFields"],
	): Promise<TC["TableFields"][]> {
		return this.model.updateByParams(
			{ $and: options.params, $or: options.paramsOr },
			params,
		);
	}

	async updateOneByPk(pk: string, params: TC["UpdateFields"]): Promise<TC["TableFields"]> {
		return this.model.updateOneByPk(pk, params);
	}

}
