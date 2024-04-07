import * as Types from "../types.js";

import { processMappings } from "./process-mappings.js";

export const compareFields = (
	params: Types.TSearchParams = {},
	paramsOr?: Types.TSearchParams[],
) => {
	const nullFields: string[] = [];

	const fields: Types.TField[] = [];
	const values: unknown[] = [];

	for (const [key, value] of Object.entries(params)) {
		if (value === null) {
			nullFields.push(`${key} IS NULL`);
		} else if (typeof value === "object") {
			if (Array.isArray(value)) {
				for (const v of value) {
					for (const k of Object.keys(v)) {
						const processFunction = processMappings.get(k);

						if (!processFunction) {
							throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
						}

						processFunction(key, v, fields, nullFields, values);
					}
				}
			} else {
				for (const k of Object.keys(value)) {
					const processFunction = processMappings.get(k);

					if (!processFunction) {
						throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
					}

					processFunction(key, value, fields, nullFields, values);
				}
			}
		} else if (value !== undefined) {
			fields.push({ key, operator: "=" });
			values.push(value);
		}
	}

	const fieldsOr: { fields: Types.TField[]; nullFields: string[]; }[] = [];

	if (paramsOr) {
		for (const params of paramsOr) {
			const fieldsOrLocal: Types.TField[] = [];
			const nullFieldsOrLocal: string[] = [];

			for (const [key, value] of Object.entries(params)) {
				if (value === null) {
					nullFieldsOrLocal.push(`${key} IS NULL`);
				} else if (typeof value === "object") {
					if (Array.isArray(value)) {
						for (const v of value) {
							for (const k of Object.keys(v)) {
								const processFunction = processMappings.get(k);

								if (!processFunction) {
									throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
								}

								processFunction(key, v, fieldsOrLocal, nullFieldsOrLocal, values);
							}
						}
					} else {
						for (const k of Object.keys(value)) {
							const processFunction = processMappings.get(k);

							if (!processFunction) {
								throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
							}

							processFunction(key, value, fieldsOrLocal, nullFieldsOrLocal, values);
						}
					}
				} else if (value !== undefined) {
					fieldsOrLocal.push({ key, operator: "=" });
					values.push(value);
				}
			}

			fieldsOr.push({ fields: fieldsOrLocal, nullFields: nullFieldsOrLocal });
		}
	}

	return { fields, fieldsOr, nullFields, values };
};
