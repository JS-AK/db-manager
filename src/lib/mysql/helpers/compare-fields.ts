import * as Types from "../model/types.js";

import { processMappings } from "./process-mappings.js";

/**
 * Compares and processes search parameters into query fields and values.
 *
 * @param [params={}] - The main search parameters as key-value pairs.
 * @param [paramsOr=[]] - An array of additional search parameters, each of which is treated as an OR condition.
 * @returns An object containing the following properties:
 *  - `queryArray`: An array of fields derived from the main search parameters.
 *  - `queryOrArray`: An array of objects, each containing a `query` array of fields, representing the OR conditions.
 *  - `values`: An array of values corresponding to the fields in `queryArray` and `queryOrArray`.
 */
export const compareFields = (
	params: Types.TSearchParams = {},
	paramsOr?: Types.TSearchParams[],
): {
	queryArray: Types.TField[];
	queryOrArray: { query: Types.TField[]; }[];
	values: unknown[];
} => {
	const queryArray: Types.TField[] = [];
	const values: unknown[] = [];

	for (const entry of Object.entries(params)) {
		const key = entry[0];
		const value = entry[1];

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

			for (const entry of Object.entries(params)) {
				const key = entry[0];
				const value = entry[1];

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
