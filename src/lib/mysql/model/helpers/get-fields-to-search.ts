import * as SharedTypes from "../../../../shared-types/index.js";
import * as Types from "../types.js";

import { operatorMappings } from "./operator-mappings.js";

export const getFieldsToSearch = (
	data: {
		queryArray: Types.TField[];
		queryOrArray?: { query: Types.TField[]; }[];
	},
	selected = ["*"],
	pagination?: SharedTypes.TPagination,
	order?: { orderBy: string; ordering: SharedTypes.TOrdering; } | { orderBy: string; ordering: SharedTypes.TOrdering; }[],
) => {
	const { queryArray, queryOrArray } = data;

	const res = {
		orderByFields: "",
		paginationFields: "",
		searchFields: " WHERE ",
		selectedFields: selected.join(", "),
	};

	let searchFields;

	if (queryArray.length) {
		searchFields = queryArray.map((e: Types.TField) => {
			const operatorFunction = operatorMappings.get(e.operator);

			if (operatorFunction) return operatorFunction(e);

			else return ` ${e.key} ${e.operator} ?`;
		}).join(" AND ");
	} else {
		searchFields = "1=1";
	}

	res.searchFields += searchFields;

	if (queryOrArray?.length) {
		const comparedFieldsOr = [];

		for (const row of queryOrArray) {
			const { query } = row;
			const comparedFields = query.map((e: Types.TField) => {
				const operatorFunction = operatorMappings.get(e.operator);

				if (operatorFunction) return operatorFunction(e);

				else return ` ${e.key} ${e.operator} ?`;
			}).join(" AND ");

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
