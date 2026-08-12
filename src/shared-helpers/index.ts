import * as SharedTypes from "../shared-types";

export function clearUndefinedFields(params: SharedTypes.TRawParams): SharedTypes.TRawParamsPrepared {
	const result: SharedTypes.TRawParamsPrepared = {};

	for (const key in params) {
		if (typeof params[key] === "undefined") continue;

		result[key] = params[key] as object | string | number | boolean | null;
	}

	return result;
}

/**
 * Snapshots repository constructor args for later recreation via `setupClient`.
 *
 * Omits `client` and keeps `options.logger` by reference — both are not
 * `structuredClone`-compatible (executors are EventEmitters; loggers are functions).
 */
export function cloneRepositoryInitialArgs<
	TSchema,
	TDbCreds,
	TOptions extends { logger?: SharedTypes.TLogger; },
>(config: {
	client?: unknown;
	dbCreds?: TDbCreds;
	options?: TOptions;
	schema: TSchema;
}): {
	dbCreds?: TDbCreds;
	options?: TOptions;
	schema: TSchema;
} {
	const { dbCreds, options, schema } = config;

	let clonedOptions: TOptions | undefined;

	if (options) {
		const { logger, ...restOptions } = options;

		clonedOptions = {
			...structuredClone(restOptions),
			...(logger !== undefined ? { logger } : {}),
		} as TOptions;
	}

	return {
		dbCreds: dbCreds !== undefined ? structuredClone(dbCreds) : undefined,
		options: clonedOptions,
		schema: structuredClone(schema),
	};
}

export function isHasFields<T extends object>(
	obj: T,
	fields: Array<Extract<keyof T, string> | string>,
): boolean {
	const objKeys = Object.keys(obj);

	for (const key of objKeys) {
		if (!fields.includes(key)) {
			return false;
		}
	}

	return fields.every((field) => objKeys.includes(field));
}

export function quoteMysqlIdent(bare: string, options?: {
	force?: boolean;
	tableFieldsSet?: Set<string>;
}): string {
	const { force, tableFieldsSet } = options || {};

	if (force) {
		return `\`${bare}\``;
	}

	if (!tableFieldsSet?.has(bare)) {
		return bare;
	}

	return `\`${bare}\``;
}

export function quotePgIdent(bare: string, options?: {
	force?: boolean;
	tableFieldsSet?: Set<string>;
}): string {
	const { force, tableFieldsSet } = options || {};

	if (force) {
		return `"${bare}"`;
	}

	if (!tableFieldsSet?.has(bare)) {
		return bare;
	}

	return `"${bare}"`;
}
