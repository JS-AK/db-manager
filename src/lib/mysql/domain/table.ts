import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";

import { BaseTable as Model, TExecutor } from "../model/index.js";

export type BaseTableGeneric = {
	AdditionalSortingFields?: string;
	CreateFields?: SharedTypes.TRawParams;
	CoreFields: SharedTypes.TRawParams;
	SearchFields?: Types.TDomainFields;
	UpdateFields?: SharedTypes.TRawParams;
};

/**
 * A class representing a base table with generic type parameters for handling database operations.
 */
export class BaseTable<
	M extends Model = Model,
	BTG extends BaseTableGeneric = BaseTableGeneric
> {
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
	 * Initializes a new instance of the `BaseTable` class.
	 *
	 * @param data - The domain data object containing the model.
	 *
	 * @throws {Error} If `data.model` is not an instance of `Model`.
	 */
	constructor(data: Types.TDomain<M>) {
		if (!(data.model instanceof Model)) {
			throw new Error("You need pass data.model extended of MYSQL.Model.BaseTable");
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

	/**
	 * Compare query operations for the table.
	 */
	compareQuery = {

		/**
		 * Compare query of `Creates multiple records in the database`.
		 *
		 * @param recordParams - An array of parameters for creating new records.
		 *
		 * @returns An object containing the SQL query string and the values to be inserted.
		 */
		createMany: (
			recordParams: Types.TConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>[],
		): Types.TCompareQueryResult => this.model.compareQuery.createMany(recordParams),

		/**
		 * Compare query of `Creates a single record in the database`.
		 *
		 * @param recordParams - The parameters required to create a new record.
		 *
		 * @returns An object containing the SQL query string and the values to be inserted.
		 */
		createOne: (
			recordParams: Types.TConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>,
		): Types.TCompareQueryResult => this.model.compareQuery.createOne(recordParams),

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
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
		getArrByParams: <T extends keyof BTG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BTG["CoreFields"], string> | (BTG["AdditionalSortingFields"] extends string ? BTG["AdditionalSortingFields"] : never);
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
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
				params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
				paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
		getOneByParams: <T extends keyof BTG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
		 * Constructs a SQL stream query for selecting records based on the provided search parameters.
		 * This version is optimized for large datasets where streaming is preferred over loading everything into memory.
		 *
		 * @param options - The options for retrieving records.
		 * @param options.params - The search parameters to match records.
		 * @param [options.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param [options.selected] - The fields to return for each matched record.
		 * @param [options.pagination] - The pagination options.
		 * @param [options.order] - The sorting options.
		 *
		 * @returns The SQL query and its parameter values for use with a streaming interface.
		 */
		streamArrByParams: <T extends keyof BTG["CoreFields"]>(options: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
			selected?: [T, ...T[]];
			pagination?: SharedTypes.TPagination;
			order?: {
				orderBy: Extract<keyof BTG["CoreFields"], string> | (BTG["AdditionalSortingFields"] extends string ? BTG["AdditionalSortingFields"] : never);
				ordering: SharedTypes.TOrdering;
			}[];
		}): Types.TCompareQueryResult => this.model.compareQuery.streamArrByParams({ $and: options.params, $or: options.paramsOr }, options.selected as string[], options.pagination, options.order),

		/**
		 * Compare query of `Updates records based on the specified search parameters`.
		 *
		 * @param queryConditions - The conditions for selecting records to update.
		 * @param queryConditions.params - The search parameters to match records for updating.
		 * @param [queryConditions.paramsOr] - An optional array of search parameters, where at least one must be matched.
		 * @param updateFields - The fields and their new values to update in the matched records.
		 *
		 * @returns An object containing the SQL query string and the values for the parameters and updated fields.
		 */
		updateByParams: (
			queryConditions: {
				params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
				paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
			},
			updateFields: Types.TConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
		): Types.TCompareQueryResult => this.model.compareQuery.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr }, updateFields),

		/**
		 * Compare query of `Updates a single record based on its primary key`.
		 *
		 * @param primaryKeyValue - The primary key of the record to update.
		 * @param updateFields - The fields and their new values to update in the matched record.
		 *
		 * @returns An object containing the SQL query string and the values for the updated fields and primary key.
		 */
		updateOneByPk: <T>(
			primaryKeyValue: T,
			updateFields: Types.TConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
		): Types.TCompareQueryResult => this.model.compareQuery.updateOneByPk(primaryKeyValue, updateFields),
	};

	/**
	 * Sets the pool client in the current class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the current class with the updated client.
	 */
	setClientInCurrentClass(client: TExecutor): this {
		return new (this.constructor as new (data: Types.TDomain<M>) => this)({
			model: this.model.setClientInCurrentClass(client),
		});
	}

	/**
	 * Sets the pool client in the base class.
	 *
	 * @experimental
	 *
	 * @param client - The client connection to set.
	 *
	 * @returns A new instance of the BaseTable class with the updated client.
	 */
	setClientInBaseClass(client: TExecutor): BaseTable<Model, BTG> {
		return new BaseTable({ model: this.model.setClientInBaseClass(client) });
	}

	/**
	 * Creates a single record in the database.
	 *
	 * @param recordParams - The parameters required to create a new record.
	 *
	 * @returns A promise that resolves to the created record or the selected fields from it.
	 *
	 * @throws {Error} If the record could not be saved to the database.
	 */
	async createOne(
		recordParams: Types.TConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>,
	): Promise<number> {
		const res = await this.model.createOne(recordParams);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error. If u have not auto increment primary key please pass isPKAutoIncremented option to BaseModel`);

		return res;
	}

	/**
	 * Creates multiple records in the database.
	 *
	 * @param recordParams - An array of parameters required to create each record.
	 *
	 * @returns A promise that resolves to an array of created records or the selected fields from each record.
	 *
	 * @throws {Error} If the records could not be saved to the database.
	 */
	async createMany(
		recordParams: Types.TConditionalRawParamsType<BTG["CreateFields"], BTG["CoreFields"]>[],
	): Promise<void> {
		await this.model.createMany(recordParams);

		return;
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
	 * Drops the database table.
	 *
	 * @param [options] - The options for dropping the table.
	 * @param [options.cascade] - Whether to drop objects that depend on this table.
	 * @param [options.ifExists] - Whether to include the IF EXISTS clause.
	 * @param [options.restrict] - Whether to restrict the drop to prevent dropping the table if there are any dependent objects.
	 *
	 * @returns A promise that resolves when the table is dropped.
	 */
	async dropTable(options: {
		cascade?: boolean;
		ifExists?: boolean;
		restrict?: boolean;
	} = {}): Promise<void> {
		return this.model.dropTable(options);
	}

	/**
	 * Truncates the database table.
	 *
	 * @param[options] - The options for truncating the table.
	 * @param [options.cascade] - Whether to truncate objects that depend on this table.
	 * @param [options.continueIdentity] - Whether to continue identity values.
	 * @param [options.restrict] - Whether to restrict the truncate to prevent truncating the table if there are any dependent objects.
	 * @param [options.only] - Whether to truncate only the specified table and not any of its descendant tables.
	 * @param [options.restartIdentity] - Whether to restart identity values.
	 *
	 * @returns A promise that resolves when the table is truncated.
	 */
	async truncateTable(options: {
		cascade?: boolean;
		continueIdentity?: boolean;
		restrict?: boolean;
		only?: boolean;
		restartIdentity?: boolean;
	} = {}): Promise<void> {
		return this.model.truncateTable(options);
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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
	}): Promise<void> {
		return this.model.deleteByParams({ $and: options.params, $or: options.paramsOr });
	}

	/**
	 * Deletes a single record based on its primary key.
	 *
	 * @param pk - The primary key of the record to delete.
	 *
	 * @returns A promise that resolves to the deleted primary key if successful, or `null` if no record was found.
	 */
	async deleteOneByPk<T>(pk: T): Promise<void> {
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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
	}): Promise<number> {
		return this.model.getCountByParams({ $and: options.params, $or: options.paramsOr });
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
	async getOneByParams<T extends keyof BTG["CoreFields"]>(options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
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
		const one = await this.model.getOneByPk<T, BTG["CoreFields"]>(pk);

		if (!one) return { message: `Not found from ${this.model.tableName}` };

		return { one };
	}

	/**
	 * Streams records from the database based on the specified search parameters.
	 *
	 * This method returns a readable stream of records that match the given filter conditions.
	 * Useful for efficiently processing large datasets without loading them entirely into memory.
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
	async streamArrByParams<T extends keyof BTG["CoreFields"]>(this: BaseTable<M, BTG>, options: {
		params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
		paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
		selected?: [T, ...T[]];
		pagination?: SharedTypes.TPagination;
		order?: {
			orderBy: Extract<keyof BTG["CoreFields"], string> | (BTG["AdditionalSortingFields"] extends string ? BTG["AdditionalSortingFields"] : never);
			ordering: SharedTypes.TOrdering;
		}[];
	}): Promise<SharedTypes.ITypedPgStream<Pick<BTG["CoreFields"], T>>> {
		return this.model.streamArrByParams<Pick<BTG["CoreFields"], T>>(
			{ $and: options.params, $or: options.paramsOr },
			options.selected as string[],
			options.pagination,
			options.order,
		);
	}

	/**
	 * Updates records that match the specified search parameters.
	 *
	 * @param queryConditions - The conditions for finding records to update.
	 * @param queryConditions.params - The search parameters to match records.
	 * @param [queryConditions.paramsOr] - An optional array of search parameters, where at least one must be matched.
	 * @param updateFields - The fields to update in the matched records.
	 *
	 * @returns A promise that resolves to an array of updated records.
	 */
	async updateByParams(
		queryConditions: {
			params: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>;
			paramsOr?: Types.TSearchParams<Types.TConditionalDomainFieldsType<BTG["SearchFields"], BTG["CoreFields"]>>[];
		},
		updateFields: Types.TConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
	): Promise<void> {
		await this.model.updateByParams({ $and: queryConditions.params, $or: queryConditions.paramsOr }, updateFields);

		return;
	}

	/**
	 * Updates a single record by its primary key.
	 *
	 * @param primaryKeyValue - The primary key of the record to update.
	 * @param updateFields - The fields to update in the record.
	 *
	 * @returns A promise that resolves to the updated record or `undefined` if the update failed.
	 */
	async updateOneByPk<T>(
		primaryKeyValue: T,
		updateFields: Types.TConditionalRawParamsType<BTG["UpdateFields"], BTG["CoreFields"]>,
	): Promise<void> {
		await this.model.updateOneByPk<T>(primaryKeyValue, updateFields);

		return;
	}
}
