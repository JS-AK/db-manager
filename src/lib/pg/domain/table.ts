import pg from "pg";

import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseTable as Model } from "../model/index.js";

type ConditionalRawParamsType<First, Second> = First extends SharedTypes.TRawParams ? First : Partial<Second>;
type ConditionalDomainFieldsType<First, Second> = First extends Types.TDomainFields ? First : Partial<Second>;

export type BaseTableGeneric = {
	AdditionalSortingFields?: string;
	CreateFields?: SharedTypes.TRawParams;
	CoreFields: SharedTypes.TRawParams;
	SearchFields?: Types.TDomainFields;
	UpdateFields?: SharedTypes.TRawParams;
};

export class BaseTable<
	M extends Model = Model,
	BTG extends BaseTableGeneric = BaseTableGeneric
> {
	#createField;
	#primaryKey;
	#tableName;
	#tableFields;
	#updateField;

	model: M;

	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of PG.Model.BaseTable");
		}

		this.model = data.model;

		this.#createField = this.model.createField;
		this.#primaryKey = this.model.primaryKey;
		this.#tableName = this.model.tableName;
		this.#tableFields = this.model.tableFields;
		this.#updateField = this.model.updateField;
	}

	/**
	 * Gets the field used for creation timestamps in the table, if applicable.
	 *
	 * @returns The creation field configuration object or `null` if not set.
	 */
	get createField() {
		return this.#createField as { title: keyof BTG["CoreFields"]; type: "unix_timestamp" | "timestamp"; } | null;
	}

	/**
	 * Gets the primary key of the table.
	 *
	 * @returns The primary key of the table.
	 */
	get primaryKey() {
		return this.#primaryKey;
	}

	/**
	 * Gets the name of the database table.
	 *
	 * @returns The name of the table.
	 */
	get tableName() {
		return this.#tableName;
	}

	/**
	 * Gets the fields of the database table.
	 *
	 * @returns An array of field names in the table.
	 */
	get tableFields() {
		return this.#tableFields;
	}

	/**
	 * Gets the field used for update timestamps in the table, if applicable.
	 *
	 * @returns The update field configuration object or `null` if not set.
	 */
	get updateField() {
		return this.#updateField as { title: keyof BTG["CoreFields"]; type: "unix_timestamp" | "timestamp"; } | null;
	}

	compareQuery = {
		createOne: (
			recordParams: ConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>,
			saveOptions?: { returningFields?: Extract<keyof BTG["CoreFields"], string>[]; },
		) => this.model.compareQuery.createOne(recordParams, saveOptions),
		deleteAll: () => this.model.compareQuery.deleteAll(),
		deleteByParams: (options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
		}) => this.model.compareQuery.deleteByParams({ $and: options.params, $or: options.paramsOr }),
		deleteOneByPk: <T>(pk: T) => this.model.compareQuery.deleteOneByPk(pk),
		getArrByParams: <T extends keyof BTG["CoreFields"]>(options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BTG["CoreFields"], string> | (BTG["AdditionalSortingFields"] extends string ? BTG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}) => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),
		getCountByParams: (options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
		}) => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),
		getCountByPks: <T>(pks: T[]) => this.model.compareQuery.getCountByPks(pks),
		getCountByPksAndParams: <T>(
			pks: T[],
			options: {
				params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
			},
		) => this.model.compareQuery.getCountByPksAndParams(pks, { $and: options.params, $or: options.paramsOr }),
		getOneByParams: <T extends keyof BTG["CoreFields"]>(options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
			selected?: [T, ...T[]];
		}) => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),
		getOneByPk: <T>(pk: T) => this.model.compareQuery.getOneByPk(pk),
		updateByParams: <T extends Extract<keyof BTG["CoreFields"], string>[] = Extract<keyof BTG["CoreFields"], string>[]>(
			queryConditions: {
				params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
				returningFields?: T;
			},
			updateFields: ConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
		) => this.model.compareQuery.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields),
		updateOneByPk: <T, R extends Extract<keyof BTG["CoreFields"], string>[] = Extract<keyof BTG["CoreFields"], string>[]>(
			primaryKeyValue: T,
			updateFields: ConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
			updateOptions?: { returningFields?: R; },
		) => this.model.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions),
	};

	/**
	 * Sets the pool client in the current class.
	 *
	 * @experimental
	 * @param poolClient - The pool client to set.
	 *
	 * @returns A new instance of the current class with the updated pool client.
	 */
	setPoolClientInCurrentClass(poolClient: pg.PoolClient): this {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return new this.constructor({ model: this.model.setPoolClientInCurrentClass(poolClient) });
	}

	/**
	 * Sets the pool client in the base class.
	 *
	 * @experimental
	 * @param poolClient - The pool client to set.
	 *
	 * @returns A new instance of the BaseTable class with the updated pool client.
	 */
	setPoolClientInBaseClass(poolClient: pg.PoolClient): BaseTable<Model, BTG> {
		return new BaseTable({ model: this.model.setPoolClientInBaseClass(poolClient) });
	}

	/**
	 * Creates a single record in the database.
	 *
	 * @param recordParams - The parameters required to create a new record.
	 * @param [saveOptions] - Optional settings for saving the record.
	 * @param [saveOptions.returningFields] - The fields to return after creating the record.
	 *
	 * @returns A promise that resolves to the created record or the selected fields from it.
	 *
	 * @throws {Error} If the record could not be saved to the database.
	 */
	async createOne<T extends Extract<keyof BTG["CoreFields"], string>[] = Extract<keyof BTG["CoreFields"], string>[]>(
		recordParams: ConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>,
		saveOptions?: { returningFields?: T; },
	): Promise<T extends undefined ? BTG["CoreFields"] : Pick<BTG["CoreFields"], T[0]>> {
		const res = await this.model.createOne<T extends undefined ? BTG["CoreFields"] : Pick<BTG["CoreFields"], T[0]>>(recordParams, saveOptions);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	/**
	 * Creates multiple records in the database.
	 *
	 * @param recordParams - An array of parameters required to create each record.
	 * @param [saveOptions] - Optional settings for saving the records.
	 * @param [saveOptions.returningFields] - The fields to return for each record after creation.
	 *
	 * @returns A promise that resolves to an array of created records or the selected fields from each record.
	 *
	 * @throws {Error} If the records could not be saved to the database.
	 */
	async createMany<T extends Extract<keyof BTG["CoreFields"], string>[] = Extract<keyof BTG["CoreFields"], string>[]>(
		recordParams: ConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>[],
		saveOptions?: { returningFields?: T; },
	): Promise<(T extends undefined ? BTG["CoreFields"][] : Pick<BTG["CoreFields"], T[0]>[])[]> {
		const res = await this.model.createMany<T extends undefined ? BTG["CoreFields"][] : Pick<BTG["CoreFields"], T[0]>[]>(recordParams, saveOptions);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	/**
	 * Deletes all records from the database table.
	 *
	 * @returns A promise that resolves when the deletion is complete.
	 */
	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	/**
	 * Deletes records based on the specified search parameters.
	 *
	 * @param options - The options for deleting records.
	 * @param options.params - The search parameters to match records for deletion.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched for deletion.
	 *
	 * @returns A promise that resolves to `null` when the deletion is complete.
	 */
	async deleteByParams(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
	}): Promise<null> {
		return this.model.deleteByParams(
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	/**
	 * Deletes a single record based on its primary key.
	 *
	 * @param pk - The primary key of the record to delete.
	 *
	 * @returns A promise that resolves to the deleted primary key if successful, or `null` if no record was found.
	 */
	async deleteOneByPk<T>(pk: T): Promise<T | null> {
		return this.model.deleteOneByPk<T>(pk);
	}

	/**
	 * Retrieves an array of records based on the specified search parameters.
	 *
	 * @param options - The options for retrieving records.
	 * @param options.params - The search parameters to match records.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param [options.selected] - The fields to return for each matched record.
	 * @param [options.pagination] - The pagination options.
	 * @param [options.order] - The sorting options.
	 * @param options.order.orderBy - The field by which to sort the results.
	 * @param options.order.ordering - The ordering direction (e.g., ASC, DESC).
	 *
	 * @returns A promise that resolves to an array of records with the selected fields.
	 */
	async getArrByParams<T extends keyof BTG["CoreFields"]>(this: BaseTable<M, BTG>, options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof BTG["CoreFields"], string> | (BTG["AdditionalSortingFields"] extends string ? BTG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<BTG["CoreFields"], T>>> {
		return this.model.getArrByParams<Pick<BTG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	/**
	 * Gets the count of records that match the specified primary keys.
	 *
	 * @param pks - An array of primary keys to count the matching records.
	 *
	 * @returns A promise that resolves to the number of matching records.
	 */
	async getCountByPks<T>(pks: T[]): Promise<number> {
		return this.model.getCountByPks(pks);
	}

	/**
	 * Gets the count of records that match the specified primary keys and search parameters.
	 *
	 * @param pks - An array of primary keys to count the matching records.
	 * @param options - The options for filtering records.
	 * @param options.params - The search parameters to match records.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 *
	 * @returns A promise that resolves to the number of matching records.
	 */
	async getCountByPksAndParams<T>(
		pks: T[],
		options: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
		},
	): Promise<number> {
		return this.model.getCountByPksAndParams(
			pks,
			{ $and: options.params, $or: options.paramsOr },
		);
	}

	/**
	 * Gets the count of records that match the specified search parameters.
	 *
	 * @param options - The options for filtering records.
	 * @param options.params - The search parameters to match records.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 *
	 * @returns A promise that resolves to the number of matching records.
	 */
	async getCountByParams(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	async getOneByParams<T extends keyof BTG["CoreFields"]>(options: {
		params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<BTG["CoreFields"], T>; }> {
		const one = await this.model.getOneByParams<Pick<BTG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	/**
	 * Retrieves a single record based on the specified search parameters.
	 *
	 * @param options - The options for retrieving the record.
	 * @param options.params - The search parameters to match the record.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param [options.selected] - The fields to return for the matched record.
	 *
	 * @returns A promise that resolves to the retrieved record with the selected fields or a message if not found.
	 */
	async getOneByPk<T>(pk: T): Promise<{ message?: string; one?: BTG["CoreFields"]; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	/**
	 * Updates records that match the specified search parameters.
	 *
	 * @param queryConditions - The conditions for finding records to update.
	 * @param queryConditions.params - The search parameters to match records.
	 * @param [queryConditions.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param [queryConditions.returningFields] - The fields to return for each updated record.
	 * @param updateFields - The fields to update in the matched records.
	 *
	 * @returns A promise that resolves to an array of updated records.
	 */
	async updateByParams<T extends Extract<keyof BTG["CoreFields"], string>[] = Extract<keyof BTG["CoreFields"], string>[]>(
		queryConditions: {
			params: Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<ConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>>;
			returningFields?: T;
		},
		updateFields: ConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
	): Promise<BTG["CoreFields"][]> {
		return this.model.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields);
	}

	/**
	 * Updates a single record by its primary key.
	 *
	 * @param primaryKeyValue - The primary key of the record to update.
	 * @param updateFields - The fields to update in the record.
	 * @param [updateOptions] - Optional settings for updating the record.
	 * @param [updateOptions.returningFields] - The fields to return after updating the record.
	 *
	 * @returns A promise that resolves to the updated record or `undefined` if the update failed.
	 */
	async updateOneByPk<T, R extends Extract<keyof BTG["CoreFields"], string>[] = Extract<keyof BTG["CoreFields"], string>[]>(
		primaryKeyValue: T,
		updateFields: ConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
		updateOptions?: { returningFields?: R; },
	): Promise<BTG["CoreFields"] | undefined> {
		const one = await this.model.updateOneByPk<BTG["CoreFields"], T>(primaryKeyValue, updateFields, updateOptions);

		return one;
	}
}
