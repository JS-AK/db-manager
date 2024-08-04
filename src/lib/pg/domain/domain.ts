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
			throw new Error("You need pass extended of BaseModel");
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

	compareQuery = {
		createOne: (
			recordParams: ConditionalRawParamsType<TC["CreateFields"], TC["TableFields"]>,
			saveOptions?: { returningFields?: Extract<keyof TC["TableFields"], string>[]; },
		) => this.model.compareQuery.save(recordParams, saveOptions),
		deleteAll: () => this.model.compareQuery.deleteAll(),
		deleteByParams: (options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		}) => this.model.compareQuery.deleteByParams({ $and: options.params, $or: options.paramsOr }),
		deleteOneByPk: <T = string | number>(pk: T) => this.model.compareQuery.deleteOneByPk(pk),
		getArrByParams: <T extends keyof TC["TableFields"]>(options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof TC["TableFields"], string> | (TC["AdditionalSortingFields"] extends string ? TC["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}) => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),
		getCountByParams: (options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		}) => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),
		getCountByPks: <T = string | number>(pks: T[]) => this.model.compareQuery.getCountByPks(pks),
		getCountByPksAndParams: <T = string | number>(
			pks: T[],
			options: {
				params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			},
		) => this.model.compareQuery.getCountByPksAndParams(pks, { $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof TC["TableFields"]>(options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
		getOneByPk: <T = string | number>(pk: T) => this.model.compareQuery.getOneByPk(pk),
		updateByParams: <T extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
			queryConditions: {
				params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
				returningFields?: T;
			},
			updateFields: ConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
		) => this.model.compareQuery.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields),
		updateOneByPk: <T extends string | number = string | number, R extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
			primaryKeyValue: T,
			updateFields: ConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
			updateOptions?: { returningFields?: R; },
		) => this.model.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions),
	};

	async createOne<T extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
		recordParams: ConditionalRawParamsType<TC["CreateFields"], TC["TableFields"]>,
		saveOptions?: { returningFields?: T; },
	): Promise<T extends undefined ? TC["TableFields"] : Pick<TC["TableFields"], T[0]>> {
		const res = await this.model.save(recordParams, saveOptions);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async deleteByParams(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
	}): Promise<null> {
		return this.model.deleteByParams(
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async deleteOneByPk<T = string | number>(pk: T): Promise<T | null> {
		return this.model.deleteOneByPk<T>(pk);
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
		);
	}

	async getCountByPks<T = string | number>(pks: T[]): Promise<number> {
		return this.model.getCountByPks(pks);
	}

	async getCountByPksAndParams<T = string | number>(
		pks: T[],
		options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		},
	): Promise<number> {
		return this.model.getCountByPksAndParams(
			pks,
			{ $and: options.params, $or: options.paramsOr },
		);
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
		);
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

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async getOneByPk<T = string | number>(pk: T): Promise<{ message?: string; one?: TC["TableFields"]; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async updateByParams<T extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
		queryConditions: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			returningFields?: T;
		},
		updateFields: ConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
	): Promise<TC["TableFields"][]> {
		return this.model.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields);
	}

	async updateOneByPk<T extends string | number = string | number, R extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
		primaryKeyValue: T,
		updateFields: ConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
		updateOptions?: { returningFields?: R; },
	): Promise<TC["TableFields"]> {
		return this.model.updateOneByPk(primaryKeyValue, updateFields, updateOptions);
	}
}
