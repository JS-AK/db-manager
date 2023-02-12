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
			}
			if (value.$ne) {
				fields.push({ key, operator: "<>" });
				values.push(value.$ne);
			}
			if (value.$in) {
				fields.push({ key, operator: "$in" });
				values.push(value.$in);
			}
			if (value.$nin) {
				fields.push({ key, operator: "$nin" });
				values.push(value.$nin);
			}
			if (value.$gt) {
				fields.push({ key, operator: ">" });
				values.push(value.$gt);
			}
			if (value.$gte) {
				fields.push({ key, operator: ">=" });
				values.push(value.$gte);
			}
			if (value.$lt) {
				fields.push({ key, operator: "<" });
				values.push(value.$lt);
			}
			if (value.$lte) {
				fields.push({ key, operator: "<=" });
				values.push(value.$lte);
			}
			if (value.$like) {
				fields.push({ key, operator: "$like" });
				values.push(value.$like);
			}
			if (value.$nlike) {
				fields.push({ key, operator: "$nlike" });
				values.push(value.$nlike);
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
					if (value.$ne === null) {
						nullFieldsOrLocal.push(`${key} IS NOT NULL`);
					}
					if (value.$ne) {
						fieldsOrLocal.push({ key, operator: "<>" });
						values.push(value.$ne);
					}
					if (value.$in) {
						fieldsOrLocal.push({ key, operator: "$in" });
						values.push(value.$in);
					}
					if (value.$nin) {
						fieldsOrLocal.push({ key, operator: "$nin" });
						values.push(value.$nin);
					}
					if (value.$gt) {
						fieldsOrLocal.push({ key, operator: ">" });
						values.push(value.$gt);
					}
					if (value.$gte) {
						fieldsOrLocal.push({ key, operator: ">=" });
						values.push(value.$gte);
					}
					if (value.$lt) {
						fieldsOrLocal.push({ key, operator: "<" });
						values.push(value.$lt);
					}
					if (value.$lte) {
						fieldsOrLocal.push({ key, operator: "<=" });
						values.push(value.$lte);
					}
					if (value.$like) {
						fieldsOrLocal.push({ key, operator: "$like" });
						values.push(value.$like);
					}
					if (value.$nlike) {
						fieldsOrLocal.push({ key, operator: "$nlike" });
						values.push(value.$nlike);
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

				case "$nlike":
					return `${e.key} NOT LIKE $${res.orderNumber}`;

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

		for (const row of fieldsOr) {
			const { fields, nullFields } = row;
			let comparedFields = fields.map((e: Types.TField) => {
				res.orderNumber += 1;
				switch (e.operator) {
					case "$in":
						return `${e.key} = ANY ($${res.orderNumber})`;

					case "$nin":
						return `NOT (${e.key} = ANY ($${res.orderNumber}))`;

					case "$like":
						return `${e.key} LIKE $${res.orderNumber}`;

					case "$nlike":
						return `${e.key} NOT LIKE $${res.orderNumber}`;

					default:
						return `${e.key} ${e.operator} $${res.orderNumber}`;
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
