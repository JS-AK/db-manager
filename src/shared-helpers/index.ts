import * as SharedTypes from "../shared-types";

export function clearUndefinedFields(params: SharedTypes.TRawParams): SharedTypes.TRawParamsPrepared {
	const result: SharedTypes.TRawParamsPrepared = {};

	for (const key in params) {
		if (typeof params[key] === "undefined") continue;

		result[key] = params[key] as object | string | number | boolean | null;
	}

	return result;
}

export function isHasFields<T extends object>(obj: T, fields: Array<Extract<keyof T, string> | string>): boolean {
	const objKeys = Object.keys(obj);

	for (const key of objKeys) {
		if (!fields.includes(key)) {
			return false;
		}
	}

	return fields.every((field) => objKeys.includes(field));
}
