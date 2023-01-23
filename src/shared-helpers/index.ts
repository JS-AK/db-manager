import * as SharedTypes from "../shared-types";

export const clearUndefinedFields = (params: SharedTypes.TRawParams) => {
	return Object.keys(params).reduce((acc: SharedTypes.TRawParamsPrepared, key: string) => {
		const _acc = acc;

		const v = params[key];

		if (v !== undefined) _acc[key] = v;

		return _acc;
	}, {});
};
