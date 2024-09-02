import * as SharedTypes from "../../../../shared-types/index.js";
import * as Types from "../types.js";

import { operatorMappings } from "./operator-mappings.js";

/**
 * Generates and returns various fields required for executing a search query, including selected fields, pagination, ordering, and search conditions.
 *
 * @param {Object} data - The search data containing the query arrays.
 * @param {Types.TField[]} data.queryArray - The main array of fields to search by.
 * @param {Array<{query: Types.TField[]}>} [data.queryOrArray] - An optional array of objects, each containing a `query` array of fields representing OR conditions.
 * @param {string[]} [selected=["*"]] - An array of selected fields for the search query. Defaults to selecting all fields ("*").
 * @param {SharedTypes.TPagination} [pagination] - Optional pagination details including page number and page size.
 * @param {Object|Object[]} [order] - An object or an array of objects defining the ordering of the search results.
 * @param {string} order.orderBy - The field by which to order the search results.
 * @param {SharedTypes.TOrdering} order.ordering - The ordering direction, either ascending or descending.
 *
 * @returns {Object} An object containing the following properties:
 *    - `orderByFields`: A string representing the fields by which to order the search results.
 *    - `orderNumber`: A number representing the ordering priority or sequence.
 *    - `paginationFields`: A string representing the pagination details.
 *    - `searchFields`: A string representing the search conditions derived from `queryArray` and `queryOrArray`.
 *    - `selectedFields`: A string representing the fields selected for the search query.
 */
export const getFieldsToSearch = (
	data: {
		queryArray: Types.TField[];
		queryOrArray?: { query: Types.TField[]; }[];
	},
	selected = ["*"],
	pagination?: SharedTypes.TPagination,
	order?: { orderBy: string; ordering: SharedTypes.TOrdering; } | { orderBy: string; ordering: SharedTypes.TOrdering; }[],
): {
	orderByFields: string;
	orderNumber: number;
	paginationFields: string;
	searchFields: string;
	selectedFields: string;
} => {
	const { queryArray, queryOrArray } = data;

	const res = {
		orderByFields: "",
		orderNumber: 0,
		paginationFields: "",
		searchFields: " WHERE ",
		selectedFields: selected.join(", "),
	};

	let searchFields;

	if (queryArray.length) {
		searchFields = queryArray.map((e: Types.TField) => {
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

	res.searchFields += searchFields;

	if (queryOrArray?.length) {
		const comparedFieldsOr = [];

		for (const row of queryOrArray) {
			const { query } = row;
			const comparedFields = query.map((e: Types.TField) => {
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
