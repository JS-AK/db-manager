import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";

export const compareFields = (
	params: Types.TSearchParams = {},
	paramsOr?: Types.TSearchParams[],
) => {
	const nullFields: string[] = [];

	const fields: Types.TField[] = [];
	const values: any[] = [];

	for (const [key, value] of Object.entries(params)) {
		if (value === null) {
			nullFields.push(`${key} IS NULL`);
		} else if (typeof value === "object") {
			if (value.$ne === null) {
				nullFields.push(`${key} IS NOT NULL`);
			} else if (value.$ne) {
				fields.push({ key, operator: "<>" });
				values.push(value.$ne);
			} else if (value.$in || value.$nin) {
				if (value.$in) {
					fields.push({ key, operator: "$in" });
					values.push(value.$in);
				}
				if (value.$nin) {
					fields.push({ key, operator: "$nin" });
					values.push(value.$nin);
				}
			} else if ((value.$gt || value.$gte) && (value.$lt || value.$lte)) {
				if (value.$gt) {
					fields.push({ key, operator: ">" });
					values.push(value.$gt);
				} else if (value.$gte) {
					fields.push({ key, operator: ">=" });
					values.push(value.$gte);
				}
				if (value.$lt) {
					fields.push({ key, operator: "<" });
					values.push(value.$lt);
				} else if (value.$lte) {
					fields.push({ key, operator: "<=" });
					values.push(value.$lte);
				}
			} else if (value.$gt) {
				fields.push({ key, operator: ">" });
				values.push(value.$gt);
			} else if (value.$gte) {
				fields.push({ key, operator: ">=" });
				values.push(value.$gte);
			} else if (value.$lt) {
				fields.push({ key, operator: "<" });
				values.push(value.$lt);
			} else if (value.$lte) {
				fields.push({ key, operator: "<=" });
				values.push(value.$lte);
			} else if (value.$like) {
				fields.push({ key, operator: "$like" });
				values.push(value.$like);
			}
		} else if (value !== undefined) {
			fields.push({ key, operator: "=" });
			values.push(value);
		}
	}

	const fieldsOr: Types.TField[][] = [];
	const valuesOr: any[] = [];

	if (paramsOr) {
		for (const params of paramsOr) {
			const fieldsOrLocal: Types.TField[] = [];

			for (const [key, value] of Object.entries(params)) {
				if (value === null) {
					nullFields.push(`${key} IS NULL`);
				} else if (typeof value === "object") {
					if (value.$ne === null) {
						nullFields.push(`${key} IS NOT NULL`);
					} else if (value.$ne) {
						fieldsOrLocal.push({ key, operator: "<>" });
						valuesOr.push(value.$ne);
					} else if (value.$in || value.$nin) {
						if (value.$in) {
							fieldsOrLocal.push({ key, operator: "$in" });
							valuesOr.push(value.$in);
						}
						if (value.$nin) {
							fieldsOrLocal.push({ key, operator: "$nin" });
							valuesOr.push(value.$nin);
						}
					} else if ((value.$gt || value.$gte) && (value.$lt || value.$lte)) {
						if (value.$gt) {
							fieldsOrLocal.push({ key, operator: ">" });
							valuesOr.push(value.$gt);
						} else if (value.$gte) {
							fieldsOrLocal.push({ key, operator: ">=" });
							valuesOr.push(value.$gte);
						}
						if (value.$lt) {
							fieldsOrLocal.push({ key, operator: "<" });
							valuesOr.push(value.$lt);
						} else if (value.$lte) {
							fieldsOrLocal.push({ key, operator: "<=" });
							valuesOr.push(value.$lte);
						}
					} else if (value.$gt) {
						fieldsOrLocal.push({ key, operator: ">" });
						valuesOr.push(value.$gt);
					} else if (value.$gte) {
						fieldsOrLocal.push({ key, operator: ">=" });
						valuesOr.push(value.$gte);
					} else if (value.$lt) {
						fieldsOrLocal.push({ key, operator: "<" });
						valuesOr.push(value.$lt);
					} else if (value.$lte) {
						fieldsOrLocal.push({ key, operator: "<=" });
						valuesOr.push(value.$lte);
					} else if (value.$like) {
						fieldsOrLocal.push({ key, operator: "$like" });
						valuesOr.push(value.$like);
					}
				} else if (value !== undefined) {
					fieldsOrLocal.push({ key, operator: "=" });
					valuesOr.push(value);
				}
			}

			fieldsOr.push(fieldsOrLocal);
		}
	}

	return { fields, fieldsOr, nullFields, values, valuesOr };
};

export const getFieldsToSearch = (
	data: {
		fields: Types.TField[];
		fieldsOr?: Types.TField[][];
		nullFields: string[];
	},
	selected = ["*"],
	pagination?: SharedTypes.TPagination,
	order?: { orderBy: string; ordering: string; },
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
			res.orderNumber += 1;
			switch (e.operator) {
				case "$in":
					return `${e.key} = ANY ($${res.orderNumber})`;

				case "$nin":
					return `NOT (${e.key} = ANY ($${res.orderNumber}))`;

				case "$like":
					return `${e.key} LIKE $${res.orderNumber}`;

				default:
					return `${e.key} ${e.operator} $${res.orderNumber}`;
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

		for (const fields of fieldsOr) {
			const comparedFields = fields.map((e: Types.TField) => {
				res.orderNumber += 1;
				switch (e.operator) {
					case "$in":
						return `${e.key} = ANY ($${res.orderNumber})`;

					case "$nin":
						return `NOT (${e.key} = ANY ($${res.orderNumber}))`;

					case "$like":
						return `${e.key} LIKE $${res.orderNumber}`;

					default:
						return `${e.key} ${e.operator} $${res.orderNumber}`;
				}
			}).join(" AND ");

			comparedFieldsOr.push(`(${comparedFields})`);
		}

		res.searchFields += ` AND (${comparedFieldsOr.join(" OR ")})`;
	}

	if (order) {
		res.orderByFields += `ORDER BY ${order.orderBy} ${order.ordering}`;
	}

	if (pagination) {
		let { limit, offset }: SharedTypes.TPagination = pagination;

		if (typeof limit !== "number") limit = 20;
		if (typeof offset !== "number") offset = 0;

		res.paginationFields = `LIMIT ${limit} OFFSET ${offset}`;
	}

	return res;
};
