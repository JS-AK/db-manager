import * as Types from "../types.js";

import { processMappings } from "./process-mappings.js";

export const compareFields = (
	params: Types.TSearchParams = {},
	paramsOr?: Types.TSearchParams[],
) => {
	const queryArray: Types.TField[] = [];
	const values: unknown[] = [];

	for (const [key, value] of Object.entries(params)) {
		if (value === null) {
			queryArray.push({ key: `${key} IS NULL`, operator: "$withoutParameters" });
		} else if (typeof value === "object") {
			if (Array.isArray(value)) {
				for (const v of value) {
					for (const k of Object.keys(v)) {
						const processFunction = processMappings.get(k);

						if (!processFunction) {
							throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
						}

						processFunction(key, v, queryArray, values);
					}
				}
			} else {
				for (const k of Object.keys(value)) {
					const processFunction = processMappings.get(k);

					if (!processFunction) {
						throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
					}

					processFunction(key, value, queryArray, values);
				}
			}
		} else if (value !== undefined) {
			queryArray.push({ key, operator: "=" });
			values.push(value);
		}
	}

	const queryOrArray: { query: Types.TField[]; }[] = [];

	if (paramsOr) {
		if (paramsOr.length < 2) {
			throw new Error("The minimum length of the paramsOr array must be 2");
		}

		for (const params of paramsOr) {
			const queryOrArrayLocal: Types.TField[] = [];

			for (const [key, value] of Object.entries(params)) {
				if (value === null) {
					queryOrArrayLocal.push({ key: `${key} IS NULL`, operator: "$withoutParameters" });
				} else if (typeof value === "object") {
					if (Array.isArray(value)) {
						for (const v of value) {
							for (const k of Object.keys(v)) {
								const processFunction = processMappings.get(k);

								if (!processFunction) {
									throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
								}

								processFunction(key, v, queryOrArrayLocal, values);
							}
						}
					} else {
						for (const k of Object.keys(value)) {
							const processFunction = processMappings.get(k);

							if (!processFunction) {
								throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
							}

							processFunction(key, value, queryOrArrayLocal, values);
						}
					}
				} else if (value !== undefined) {
					queryOrArrayLocal.push({ key, operator: "=" });
					values.push(value);
				}
			}

			if (queryOrArrayLocal.length === 0) {
				throw new Error(`Empty object in one of the array elements ${JSON.stringify(paramsOr)}`);
			}

			queryOrArray.push({ query: queryOrArrayLocal });
		}
	}

	return { queryArray, queryOrArray, values };
};
