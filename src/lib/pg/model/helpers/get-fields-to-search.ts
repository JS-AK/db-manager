import * as SharedTypes from "../../../../shared-types/index.js";
import * as Types from "../types.js";

import { operatorMappings } from "./operator-mappings.js";

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
		searchFields: " WHERE ",
		selectedFields: selected.join(", "),
	};

	let searchFields;

	if (fields.length) {
		searchFields = fields.map((e: Types.TField) => {
			const operatorFunction = operatorMappings.get(e.operator);

			if (operatorFunction) {
				const [text, orderNumber] = operatorFunction(e, res.orderNumber);

				res.orderNumber = orderNumber;

				return text;
			} else {
				res.orderNumber += 1;

				const text = `${e.key} ${e.operator} $${res.orderNumber}`;

				return text;
			}
		}).join(" AND ");
	} else {
		searchFields = "1=1";
	}

	if (nullFields.length) {
		searchFields += ` AND ${nullFields.join(" AND ")}`;
	}

	res.searchFields += searchFields;

	if (fieldsOr?.length) {
		const comparedFieldsOr = [];

		for (const row of fieldsOr) {
			const { fields, nullFields } = row;
			let comparedFields = fields.map((e: Types.TField) => {
				const operatorFunction = operatorMappings.get(e.operator);

				if (operatorFunction) {
					const [text, orderNumber] = operatorFunction(e, res.orderNumber);

					res.orderNumber = orderNumber;

					return text;
				} else {
					res.orderNumber += 1;

					const text = `${e.key} ${e.operator} $${res.orderNumber}`;

					return text;
				}
			}).join(" AND ");

			if (nullFields.length) {
				if (comparedFields) comparedFields += ` AND ${nullFields.join(" AND ")}`;
				else comparedFields = nullFields.join(" AND ");
			}

			comparedFieldsOr.push(`(${comparedFields})`);
		}

		res.searchFields += ` AND (${comparedFieldsOr.join(" OR ")})`;
	}

	if (order) {
		if (Array.isArray(order)) {
			if (order.length) {
				res.orderByFields += ` ORDER BY ${order.map((o) => `${o.orderBy} ${o.ordering}`).join(", ")}`;
			}
		} else {
			res.orderByFields += ` ORDER BY ${order.orderBy} ${order.ordering}`;
		}
	}

	if (pagination) {
		let { limit, offset }: SharedTypes.TPagination = pagination;

		if (typeof limit !== "number") limit = 20;
		if (typeof offset !== "number") offset = 0;

		res.paginationFields = ` LIMIT ${limit} OFFSET ${offset}`;
	}

	return res;
};
