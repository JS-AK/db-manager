import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseTableModel } from "../model/index.js";

type BaseDomainGeneric = {
	Model: BaseTableModel;
	CreateFields?: SharedTypes.TRawParams;
	CoreFields: SharedTypes.TRawParams;
	UpdateFields?: SharedTypes.TRawParams;
};

export class BaseTableDomain<TC extends BaseDomainGeneric> {
	#createField;
	#primaryKey;
	#tableName;
	#tableFields;
	#updateField;

	model;

	constructor(data: Types.TDomain<TC["Model"]>) {
		if (!(data.model instanceof BaseTableModel)) {
			throw new Error("You need pass extended of BaseTableModel");
		}

		this.model = data.model;

		this.#createField = this.model.createField;
		this.#primaryKey = this.model.primaryKey;
		this.#tableName = this.model.tableName;
		this.#tableFields = this.model.tableFields;
		this.#updateField = this.model.updateField;
	}

	get createField() {
		return this.#createField as { title: keyof TC["CoreFields"]; type: "unix_timestamp" | "timestamp"; } | null;
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
		return this.#updateField as { title: keyof TC["CoreFields"]; type: "unix_timestamp" | "timestamp"; } | null;
	}

	compareQuery = {
		createOne: (
			recordParams: TC["CreateFields"] extends SharedTypes.TRawParams ? TC["CreateFields"] : Partial<TC["CoreFields"]>,
			saveOptions?: { returningFields?: Extract<keyof TC["CoreFields"], string>[]; },
		) => this.model.compareQuery.save(recordParams, saveOptions),
		deleteAll: () => this.model.compareQuery.deleteAll(),
		deleteByParams: (options: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
		}) => this.model.compareQuery.deleteByParams({ $and: options.params, $or: options.paramsOr }),
		deleteOneByPk: <T = string | number>(pk: T) => this.model.compareQuery.deleteOneByPk(pk),
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
		getCountByPks: <T = string | number>(pks: T[]) => this.model.compareQuery.getCountByPks(pks),
		getCountByPksAndParams: <T = string | number>(
			pks: T[],
			options: {
				params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
			},
		) => this.model.compareQuery.getCountByPksAndParams(pks, { $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof TC["CoreFields"]>(options: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
		getOneByPk: <T = string | number>(pk: T) => this.model.compareQuery.getOneByPk(pk),
		updateByParams: <T extends Extract<keyof TC["CoreFields"], string>[] = Extract<keyof TC["CoreFields"], string>[]>(
			queryConditions: {
				params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
				returningFields?: T;
			},
			updateFields: TC["UpdateFields"] extends SharedTypes.TRawParams ? TC["UpdateFields"] : Partial<TC["CoreFields"]>,
		) => this.model.compareQuery.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields),
		updateOneByPk: <T extends string | number = string | number, R extends Extract<keyof TC["CoreFields"], string>[] = Extract<keyof TC["CoreFields"], string>[]>(
			primaryKeyValue: T,
			updateFields: TC["UpdateFields"] extends SharedTypes.TRawParams ? TC["UpdateFields"] : Partial<TC["CoreFields"]>,
			updateOptions?: { returningFields?: R; },
		) => this.model.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions),
	};

	async createOne<T extends Extract<keyof TC["CoreFields"], string>[] = Extract<keyof TC["CoreFields"], string>[]>(
		recordParams: TC["CreateFields"] extends SharedTypes.TRawParams ? TC["CreateFields"] : Partial<TC["CoreFields"]>,
		saveOptions?: { returningFields?: T; },
	): Promise<T extends undefined ? TC["CoreFields"] : Pick<TC["CoreFields"], T[0]>> {
		const res = await this.model.save(recordParams, saveOptions);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async deleteByParams(options: {
		params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
	}): Promise<null> {
		return this.model.deleteByParams(
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async deleteOneByPk<T = string | number>(pk: T): Promise<T | null> {
		return this.model.deleteOneByPk<T>(pk);
	}

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

	async getCountByPks<T = string | number>(pks: T[]): Promise<number> {
		return this.model.getCountByPks(pks);
	}

	async getCountByPksAndParams<T = string | number>(
		pks: T[],
		options: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
		},
	): Promise<number> {
		return this.model.getCountByPksAndParams(
			pks,
			{ $and: options.params, $or: options.paramsOr },
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

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async getOneByPk<T = string | number>(pk: T): Promise<{ message?: string; one?: TC["CoreFields"]; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async updateByParams<T extends Extract<keyof TC["CoreFields"], string>[] = Extract<keyof TC["CoreFields"], string>[]>(
		queryConditions: {
			params: Types.TSearchParams<Partial<TC["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Partial<TC["CoreFields"]>>>;
			returningFields?: T;
		},
		updateFields: TC["UpdateFields"] extends SharedTypes.TRawParams ? TC["UpdateFields"] : Partial<TC["CoreFields"]>,
	): Promise<TC["CoreFields"][]> {
		return this.model.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields);
	}

	async updateOneByPk<T extends string | number = string | number, R extends Extract<keyof TC["CoreFields"], string>[] = Extract<keyof TC["CoreFields"], string>[]>(
		primaryKeyValue: T,
		updateFields: TC["UpdateFields"] extends SharedTypes.TRawParams ? TC["UpdateFields"] : Partial<TC["CoreFields"]>,
		updateOptions?: { returningFields?: R; },
	): Promise<TC["CoreFields"]> {
		return this.model.updateOneByPk(primaryKeyValue, updateFields, updateOptions);
	}
}
