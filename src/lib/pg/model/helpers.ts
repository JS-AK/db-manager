import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";

const processMappings = new Map<keyof Types.TSearchParams, (key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[],) => void>(
	[
		[
			"$custom",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $custom: { sign: string; value: string | number; }; };

				fields.push({ key, operator: "$custom", sign: v.$custom.sign });
				values.push(v.$custom.value);
			},
		],
		[
			"$gt",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $gt: number | string | boolean; };

				fields.push({ key, operator: ">" });
				values.push(v.$gt);
			},
		],
		[
			"$gte",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $gte: number | string | boolean; };

				fields.push({ key, operator: ">=" });
				values.push(v.$gte);
			},
		],
		[
			"$in",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $in: string[] | number[] | boolean[]; };

				fields.push({ key, operator: "$in" });
				values.push(v.$in);
			},
		],
		[
			"$json",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $json: object; };

				fields.push({ key, operator: "=" });
				values.push(v.$json);
			},
		],
		[
			"$jsonb",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $jsonb: object; };

				fields.push({ key, operator: "=" });
				values.push(v.$jsonb);
			},
		],
		[
			"$like",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $like: string; };

				fields.push({ key, operator: "$like" });
				values.push(v.$like);
			},
		],
		[
			"$lt",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $lt: number | string | boolean; };

				fields.push({ key, operator: "<" });
				values.push(v.$lt);
			},
		],
		[
			"$lte",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $lte: number | string | boolean; };

				fields.push({ key, operator: "<=" });
				values.push(v.$lte);
			},
		],
		[
			"$ne",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $ne: number | string | boolean | null; };

				if (v.$ne === null) {
					nullFields.push(`${key} IS NOT NULL`);
				} else {
					fields.push({ key, operator: "<>" });
					values.push(v.$ne);
				}
			},
		],
		[
			"$nin",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $nin: string[] | number[] | boolean[]; };

				fields.push({ key, operator: "$nin" });
				values.push(v.$nin);
			},
		],
		[
			"$between",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $between: string[] | number[]; };

				fields.push({ key, operator: "$between" });
				values.push(v.$between);
			},
		],
		[
			"$nbetween",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $nbetween: string[] | number[]; };

				fields.push({ key, operator: "$nbetween" });
				values.push(v.$nbetween);
			},
		],
		[
			"$nlike",
			(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], fields: Types.TField[], nullFields: string[], values: unknown[]) => {
				const v = value as { $nlike: string; };

				fields.push({ key, operator: "$nlike" });
				values.push(v.$nlike);
			}],
	]);

const operatorMappings: Map<
	string,
	(el: Types.TField, prevOrderNumber: number) => [string, number]
> = new Map([
	[
		"$custom",
		(el: Types.TField, prevOrderNumber: number) => [` ${el.key} ${el.sign} $${prevOrderNumber + 1}`, prevOrderNumber + 2],
	],
	[
		"$between",
		(el: Types.TField, prevOrderNumber: number) => [` ${el.key} BETWEEN $${prevOrderNumber + 1} AND $${prevOrderNumber + 2}`, prevOrderNumber + 3],
	],
	[
		"$in",
		(el: Types.TField, prevOrderNumber: number) => [` ${el.key} = ANY ($${prevOrderNumber + 1})`, prevOrderNumber + 2],
	],
	[
		"$like",
		(el: Types.TField, prevOrderNumber: number) => [` ${el.key} LIKE $${prevOrderNumber + 1}`, prevOrderNumber + 2],
	],
	[
		"$nin",
		(el: Types.TField, prevOrderNumber: number) => [` NOT (${el.key} = ANY ($${prevOrderNumber + 1}))`, prevOrderNumber + 2],
	],
	[
		"$nlike",
		(el: Types.TField, prevOrderNumber: number) => [` ${el.key} NOT LIKE $${prevOrderNumber + 1}`, prevOrderNumber + 2],
	],
]);

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
			for (const k of Object.keys(value)) {
				const processFunction = processMappings.get(k);

				if (!processFunction) {
					throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
				}

				processFunction(key, value, fields, nullFields, values);
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
					for (const k of Object.keys(value)) {
						const processFunction = processMappings.get(k);

						if (!processFunction) {
							throw new Error(`Invalid value.key ${k}, Available values: ${Array.from(processMappings.keys())}`);
						}

						processFunction(key, value, fieldsOrLocal, nullFieldsOrLocal, values);
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

export const getFieldsToSearch = (
	data: {
		fields: Types.TField[];
		fieldsOr?: { fields: Types.TField[]; nullFields: string[]; }[];
		nullFields: string[];
	},
	selected = ["*"],
	pagination?: SharedTypes.TPagination,
	order?: { orderBy: string; ordering: SharedTypes.TOrdering; } | { orderBy: string; ordering: SharedTypes.TOrdering; }[],
) => {
	const { fields, fieldsOr, nullFields } = data;

	const res = {
		orderByFields: "",
		orderNumber: 0,
		paginationFields: "",
		searchFields: "WHERE ",
		selectedFields: selected.join(",\r\n"),
	};

	let searchFields;

	if (fields.length) {
		searchFields = fields.map((e: Types.TField) => {
			const operatorFunction = operatorMappings.get(e.operator);

			if (operatorFunction) {
				const [text, nextOrderNumber] = operatorFunction(e, res.orderNumber);

				res.orderNumber = nextOrderNumber;

				return text;
			} else {
				return ` ${e.key} ${e.operator} $${res.orderNumber}`;
			}
		}).join(" AND ");
	} else {
		searchFields = "1=1";
	}

	if (nullFields.length) {
		if (searchFields) searchFields += ` AND ${nullFields.join(" AND ")}`;
		else searchFields = nullFields.join(",");
	}

	res.searchFields += searchFields;

	if (fieldsOr?.length) {
		const comparedFieldsOr = [];

		for (const row of fieldsOr) {
			const { fields, nullFields } = row;
			let comparedFields = fields.map((e: Types.TField) => {
				const operatorFunction = operatorMappings.get(e.operator);

				if (operatorFunction) {
					const [text, nextOrderNumber] = operatorFunction(e, res.orderNumber);

					res.orderNumber = nextOrderNumber;

					return text;
				} else {
					return ` ${e.key} ${e.operator} $${res.orderNumber}`;
				}
			}).join(" AND ");

			if (nullFields.length) {
				if (comparedFields) comparedFields += ` AND ${nullFields.join(" AND ")}`;
				else comparedFields = nullFields.join(",");
			}

			comparedFieldsOr.push(`(${comparedFields})`);
		}

		res.searchFields += ` AND (${comparedFieldsOr.join(" OR ")})`;
	}

	if (order) {
		if (Array.isArray(order)) {
			if (order.length) {
				res.orderByFields += `ORDER BY ${order.map((o) => `${o.orderBy} ${o.ordering}`).join(", ")}`;
			}
		} else {
			res.orderByFields += `ORDER BY ${order.orderBy} ${order.ordering}`;
		}
	}

	if (pagination) {
		let { limit, offset }: SharedTypes.TPagination = pagination;

		if (typeof limit !== "number") limit = 20;
		if (typeof offset !== "number") offset = 0;

		res.paginationFields = `LIMIT ${limit} OFFSET ${offset}`;
	}

	return res;
};
