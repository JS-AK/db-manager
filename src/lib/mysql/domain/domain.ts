import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseModel } from "../model/index.js";

type ConditionalRawParamsType<First, Second> = First extends SharedTypes.TRawParams ? First : Partial<Second>;
type ConditionalDomainFieldsType<First, Second> = First extends Types.TDomainFields ? First : Partial<Second>;

export class BaseDomain<TC extends {
	AdditionalSortingFields?: string;
	Model: BaseModel;
	CreateFields?: SharedTypes.TRawParams;
	SearchFields?: Types.TDomainFields;
	TableFields: SharedTypes.TRawParams;
	UpdateFields?: SharedTypes.TRawParams;
}> {
	#createField;
	#primaryKey;
	#tableName;
	#tableFields;
	#updateField;

	model;

	constructor(data: Types.TDomain<TC["Model"]>) {
		if (!(data.model instanceof BaseModel)) {
			throw new Error("You need pass extended of MYSQL.");
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

	async createOne(
		recordParams: ConditionalRawParamsType<TC["CreateFields"], TC["TableFields"]>,
	): Promise<number> {
		const res = await this.model.save(recordParams);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error. If u have not auto increment primary key please pass isPKAutoIncremented option to BaseModel`);

		return res;
	}

	async deleteOneByPk(pk: SharedTypes.TPrimaryKeyValue): Promise<void> {
		await this.model.deleteOneByPk(pk);
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async getArrByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof TC["TableFields"], string> | (TC["AdditionalSortingFields"] extends string ? TC["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<TC["TableFields"], T>>> {
		return this.model.getArrByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		) as Promise<Array<Pick<TC["TableFields"], T>>>;
	}

	async getCountByParams(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	/**
	 * @deprecated Use getOneByParams
	 */
	async getGuaranteedOneByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<Pick<TC["TableFields"], T>> {
		return this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		) as unknown as Pick<TC["TableFields"], T>;
	}

	async getOneByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<TC["TableFields"], T>; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: "Not found" };

		return { one } as { one: Pick<TC["TableFields"], T>; };
	}

	async getOneByPk(
		pk: SharedTypes.TPrimaryKeyValue,
	): Promise<{ message?: string; one?: TC["TableFields"]; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: "Not found" };

		return { one } as { one: TC["TableFields"]; };
	}

	async updateOneByPk(
		pk: SharedTypes.TPrimaryKeyValue,
		updateFields: ConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
	): Promise<void> {
		return this.model.update(pk, updateFields);
	}
}
