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

	compareQuery = {
		createOne: (createFields: TC["CreateFields"]) => this.model.compareQuery.save(createFields),
		deleteAll: () => this.model.compareQuery.deleteAll(),
		deleteByParams: (options: {
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		}) => this.model.compareQuery.deleteByParams({ $and: options.params, $or: options.paramsOr }),
		deleteOneByPk: <T = string | number>(pk: T) => this.model.compareQuery.deleteOneByPk(pk),
		getArrByParams: <T extends keyof TC["TableFields"]>(options: {
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: { orderBy: Extract<keyof TC["TableFields"], string>; ordering: SharedTypes.TOrdering; }[];
		}) => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),
		getCountByParams: (options: {
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		}) => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),
		getCountByPks: <T = string | number>(pks: T[]) => this.model.compareQuery.getCountByPks(pks),
		getCountByPksAndParams: <T = string | number>(
			pks: T[],
			options: {
				params: Types.TSearchParams<TC["SearchFields"]>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
			},
		) => this.model.compareQuery.getCountByPksAndParams(pks, { $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof TC["TableFields"]>(options: {
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
		getOneByPk: <T = string | number>(pk: T) => this.model.compareQuery.getOneByPk(pk),
		updateByParams: (
			options: {
				params: Types.TSearchParams<TC["SearchFields"]>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
			},
			update: TC["UpdateFields"],
		) => this.model.compareQuery.updateByParams({ $and: options.params, $or: options.paramsOr }, update),
		updateOneByPk: <T = string | number>(
			pk: T,
			update: TC["UpdateFields"],
		) => this.model.compareQuery.updateOneByPk(pk, update),
	};

	async createOne(createFields: TC["CreateFields"]): Promise<TC["TableFields"]> {
		const res = await this.model.save(createFields);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async deleteByParams(options: {
		params: Types.TSearchParams<TC["SearchFields"]>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
	}): Promise<null> {
		return this.model.deleteByParams(
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	async deleteOneByPk<T = string | number>(pk: T): Promise<T | null> {
		return this.model.deleteOneByPk<T>(pk);
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

	async getCountByPks<T = string | number>(pks: T[]): Promise<number> {
		return this.model.getCountByPks(pks);
	}

	async getCountByPksAndParams<T = string | number>(
		pks: T[],
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

	async getOneByPk<T = string | number>(pk: T): Promise<{ message?: string; one?: TC["TableFields"]; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	async updateByParams(
		options: {
			params: Types.TSearchParams<TC["SearchFields"]>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<TC["SearchFields"]>>;
		},
		update: TC["UpdateFields"],
	): Promise<TC["TableFields"][]> {
		return this.model.updateByParams({ $and: options.params, $or: options.paramsOr }, update);
	}

	async updateOneByPk<T = string | number>(
		pk: T,
		update: TC["UpdateFields"],
	): Promise<TC["TableFields"]> {
		return this.model.updateOneByPk(pk, update);
	}
}
