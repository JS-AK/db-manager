import * as SharedTypes from "../shared-types";

export function clearUndefinedFields(params: SharedTypes.TRawParams) {
	return Object.keys(params).reduce((acc: SharedTypes.TRawParamsPrepared, key: string) => {
		const _acc = acc;

		const v = params[key];

		if (v !== undefined) _acc[key] = v;

		return _acc;
	}, {});
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
