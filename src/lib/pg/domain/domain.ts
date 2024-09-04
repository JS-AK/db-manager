import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseModel } from "../model/index.js";

/**
 * A class representing a base table with generic type parameters for handling database operations.
 */
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

	/**
	 * The model associated with this domain.
	 */
	model;

	/**
	 * Initializes a new instance of the `BaseDomain` class.
	 *
	 * @param data - The domain data object containing the model.
	 *
	 * @throws {Error} If `data.model` is not an instance of `Model`.
	 */
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

	/**
	 * Gets the field used for creation timestamps in the table, if applicable.
	 *
	 * @returns The creation field configuration object or `null` if not set.
	 */
	get createField() {
		return this.#createField as { title: keyof TC["TableFields"]; type: "unix_timestamp" | "timestamp"; } | null;
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
		return this.#updateField as { title: keyof TC["TableFields"]; type: "unix_timestamp" | "timestamp"; } | null;
	}

	/**
	 * Compare query operations for the table.
	 */
	compareQuery = {

		/**
		 * Compare query of `Creates a single record in the database`.
		 *
		 * @param recordParams - The parameters required to create a new record.
		 * @param [saveOptions] - Optional settings for saving the record.
		 * @param [saveOptions.returningFields] - The fields to return after creating the record.
		 *
		 * @returns An object containing the SQL query string and the values to be inserted.
		 */
		createOne: (
			recordParams: Types.TConditionalRawParamsType<TC["CreateFields"], TC["TableFields"]>,
			saveOptions?: { returningFields?: Extract<keyof TC["TableFields"], string>[]; },
		): Types.TCompareQueryResult => this.model.compareQuery.save(recordParams, saveOptions),

		/**
		 * Compare query of `Deletes all records from the database table`.
		 *
		 * @returns An object containing the SQL query string and the values (empty for delete all).
		 */
		deleteAll: (): Types.TCompareQueryResult => this.model.compareQuery.deleteAll(),

		/**
		 * Compare query of `Deletes records based on the specified search parameters`.
		 *
		 * @param options - The options for deleting records.
		 * @param options.params - The search parameters to match records for deletion.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched for deletion.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		deleteByParams: (options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		}): Types.TCompareQueryResult => this.model.compareQuery.deleteByParams({ $and: options.params, $or: options.paramsOr }),

		/**
		 * Compare query of `Deletes a single record based on its primary key`.
		 *
		 * @param pk - The primary key of the record to delete.
		 *
		 * @returns An object containing the SQL query string and the value of the primary key.
		 */
		deleteOneByPk: <T>(pk: T): Types.TCompareQueryResult => this.model.compareQuery.deleteOneByPk(pk),

		/**
		 * Compare query of `Retrieves an array of records based on the specified search parameters`.
		 *
		 * @param options - The options for retrieving records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [options.selected] - The fields to return for each matched record.
		 * @param [options.pagination] - The pagination options.
		 * @param [options.order] - The sorting options.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		getArrByParams: <T extends keyof TC["TableFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof TC["TableFields"], string> | (TC["AdditionalSortingFields"] extends string ? TC["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}): Types.TCompareQueryResult => this.model.compareQuery.getArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),

		/**
		 * Compare query of `Gets the count of records that match the specified search parameters`.
		 *
		 * @param options - The options for filtering records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		getCountByParams: (options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		}): Types.TCompareQueryResult => this.model.compareQuery.getCountByParams({ $and: options.params, $or: options.paramsOr }),

		/**
		 * Compare query of `Gets the count of records that match the specified primary keys`.
		 *
		 * @param pks - An array of primary keys.
		 *
		 * @returns An object containing the SQL query string and the values for the primary keys.
		 */
		getCountByPks: <T>(pks: T[]): Types.TCompareQueryResult => this.model.compareQuery.getCountByPks(pks),

		/**
		 * Compare query of `Gets the count of records that match the specified primary keys and search parameters`.
		 *
		 * @param pks - An array of primary keys.
		 * @param options - The options for filtering records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters and primary keys.
		 */
		getCountByPksAndParams: <T>(
			pks: T[],
			options: {
				params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			},
		): Types.TCompareQueryResult => this.model.compareQuery.getCountByPksAndParams(pks, { $and: options.params, $or: options.paramsOr }),

		/**
		 * Compare query of `Retrieves a single record based on the specified search parameters`.
		 *
		 * @param options - The options for retrieving the record.
		 * @param options.params - The search parameters to match the record.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [options.selected] - The fields to return for the matched record.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters.
		 */
		getOneByParams: <T extends keyof TC["TableFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			selected?: [T, ...T[]];
		}): Types.TCompareQueryResult => this.model.compareQuery.getOneByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[]),

		/**
		 * Compare query of `Retrieves a single record based on its primary key`.
		 *
		 * @param pk - The primary key of the record to retrieve.
		 *
		 * @returns An object containing the SQL query string and the value of the primary key.
		 */
		getOneByPk: <T>(pk: T): Types.TCompareQueryResult => this.model.compareQuery.getOneByPk(pk),

		/**
		 * Compare query of `Updates records based on the specified search parameters`.
		 *
		 * @param queryConditions - The conditions for selecting records to update.
		 * @param queryConditions.params - The search parameters to match records for updating.
		 * @param [queryConditions.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [queryConditions.returningFields] - The fields to return after updating the records.
		 * @param updateFields - The fields and their new values to update in the matched records.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters and updated fields.
		 */
		updateByParams: <T extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
			queryConditions: {
				params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
				paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
				returningFields?: T;
			},
			updateFields: Types.TConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
		): Types.TCompareQueryResult => this.model.compareQuery.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr, returningFields: queryConditions.returningFields }, updateFields),

		/**
		 * Compare query of `Updates a single record based on its primary key`.
		 *
		 * @param primaryKeyValue - The primary key of the record to update.
		 * @param updateFields - The fields and their new values to update in the matched record.
		 * @param [updateOptions] - Optional settings for updating the record.
		 * @param [updateOptions.returningFields] - The fields to return after updating the record.
		 *
		 * @returns An object containing the SQL query string and the values for the updated fields and primary key.
		 */
		updateOneByPk: <T, R extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
			primaryKeyValue: T,
			updateFields: Types.TConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
			updateOptions?: { returningFields?: R; },
		): Types.TCompareQueryResult => this.model.compareQuery.updateOneByPk(primaryKeyValue, updateFields, updateOptions),
	};

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
	async createOne<T extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
		recordParams: Types.TConditionalRawParamsType<TC["CreateFields"], TC["TableFields"]>,
		saveOptions?: { returningFields?: T; },
	): Promise<T extends undefined ? TC["TableFields"] : Pick<TC["TableFields"], T[0]>> {
		const res = await this.model.save<T extends undefined ? TC["TableFields"] : Pick<TC["TableFields"], T[0]>>(recordParams, saveOptions);

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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
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
	async getArrByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof TC["TableFields"], string> | (TC["AdditionalSortingFields"] extends string ? TC["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<Array<Pick<TC["TableFields"], T>>> {
		return this.model.getArrByParams<Pick<TC["TableFields"], T>>(
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
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
	}

	/**
	 * @deprecated Use getOneByParams
	 */
	async getGuaranteedOneByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<Pick<TC["TableFields"], T>> {
		const one = await this.model.getOneByParams<Pick<TC["TableFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
		);

		if (!one) throw new Error("Could not find guaranteed one by params");

		return one;
	}

	/**
	 * Retrieves a single record based on the specified search parameters.
	 *
	 * @param options - The options for retrieving the record.
	 * @param options.params - The search parameters to match the record.
	 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param [options.selected] - The fields to return for the matched record.
	 *
	 * @returns A promise that resolves to an object containing either a message (if not found) or the matched record.
	 */
	async getOneByParams<T extends keyof TC["TableFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
		paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
		selected?: [T, ...T[]];
	}): Promise<{ message?: string; one?: Pick<TC["TableFields"], T>; }> {
		const one = await this.model.getOneByParams<Pick<TC["TableFields"], T>>(
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
	async getOneByPk<T>(pk: T): Promise<{ message?: string; one?: TC["TableFields"]; }> {
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
	async updateByParams<T extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
		queryConditions: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>;
			paramsOr?: Types.TArray2OrMore<Types.TSearchParams<Types.TConditionalDomainFieldsType<TC["SearchFields"], TC["TableFields"]>>>;
			returningFields?: T;
		},
		updateFields: Types.TConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
	): Promise<TC["TableFields"][]> {
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
	async updateOneByPk<T, R extends Extract<keyof TC["TableFields"], string>[] = Extract<keyof TC["TableFields"], string>[]>(
		primaryKeyValue: T,
		updateFields: Types.TConditionalRawParamsType<TC["UpdateFields"], TC["TableFields"]>,
		updateOptions?: { returningFields?: R; },
	): Promise<TC["TableFields"] | undefined> {
		const one = await this.model.updateOneByPk<TC["TableFields"], T>(primaryKeyValue, updateFields, updateOptions);

		return one;
	}
}
