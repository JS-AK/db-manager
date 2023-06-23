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

	async createOne(createFields: CreateFields): Promise<number> {
		const res = await this.model.save(createFields);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error. If u have not auto increment primary key please pass isPKAutoIncremented option to BaseModel`);

		return res;
	}

	async deleteOneByPk(pk: SharedTypes.TPrimaryKeyValue): Promise<void> {
		await this.model.delete(pk);
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async getArrByParams(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: (keyof TableFields)[];
		pagination?: SharedTypes.TPagination;
		order?: { orderBy: Extract<keyof TableFields, string> ; ordering: SharedTypes.TOrdering; }[];
	}): Promise<TableFields[]> {
		return this.model.getArrByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		) as Promise<TableFields[]>;
	}

	async getCountByParams(options: { params: SearchFields; }): Promise<number> {
		return this.model.getCountByParams(options.params);
	}

	async getGuaranteedOneByParams(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: (keyof TableFields)[];
	}): Promise<TableFields> {
		return this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		) as unknown as TableFields;
	}

	async getOneByParams(options: {
		params: Types.TSearchParams<SearchFields>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<SearchFields>>;
		selected?: (keyof TableFields)[];
	}): Promise<{ message?: string; one?: TableFields; }> {
		const one = await this.model.getOneByParams(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: "Not found" };

		return { one } as { one: TableFields; };
	}

	async getOneByPk(
		pk: SharedTypes.TPrimaryKeyValue,
	): Promise<{ message?: string; one?: TableFields; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: "Not found" };

		return { one } as { one: TableFields; };
	}

	async updateOneByPk(
		pk: SharedTypes.TPrimaryKeyValue,
		params: UpdateFields,
	): Promise<void> {
		return await this.model.update(pk, params);
	}
}
