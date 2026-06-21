type TRawParams = {
	[key: string]: object | string | number | boolean | null | undefined;
};

/**
 * Picks row fields by SQL `selected` keys from `CoreFields`.
 */
export type PickRowFields<
	TCore extends TRawParams,
	TSelected extends keyof TCore,
> = Pick<RowFieldsFromCore<TCore>, UnquoteSqlKey<TSelected & string>>;

/**
 * Row shape returned by the driver for all `CoreFields` columns.
 */
export type ResolveRowFields<TG extends { CoreFields: TRawParams; }> =
	RowFieldsFromCore<TG["CoreFields"]>;

/**
 * Maps all `CoreFields` keys to row object keys (unquoted when needed).
 */
export type RowFieldsFromCore<T extends TRawParams> = {
	[K in keyof T as UnquoteSqlKey<K & string>]: T[K];
};

/**
 * Converts a SQL identifier key from `CoreFields` to the JS property name returned by the driver.
 *
 * @example
 * UnquoteSqlKey<'"typeID"'> → 'typeID'
 * UnquoteSqlKey<'type_id'> → 'type_id'
 */
export type UnquoteSqlKey<S extends string> = S extends `"${infer Inner}"` ? Inner : S;
