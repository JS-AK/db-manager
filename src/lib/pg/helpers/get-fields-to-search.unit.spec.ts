import {
	describe,
	expect,
	it,
} from "vitest";

import { getFieldsToSearch } from "./get-fields-to-search.js";

describe("getFieldsToSearch", () => {
	it("should return default values with empty query", () => {
		const result = getFieldsToSearch({ queryArray: [] });

		expect(result.selectedFields).toBe("*");
		expect(result.searchFields).toBe(" WHERE (1=1)");
		expect(result.orderByFields).toBe("");
		expect(result.paginationFields).toBe("");
		expect(result.orderNumber).toBe(0);
	});

	it("should handle selected fields", () => {
		const result = getFieldsToSearch({ queryArray: [] }, ["id", "name"]);

		expect(result.selectedFields).toBe("id, name");
	});

	it("should handle simple queryArray", () => {
		const data = {
			queryArray: [{ key: "name", operator: "=" }],
		};
		// @ts-expect-error - mock
		const result = getFieldsToSearch(data);

		expect(result.searchFields).toBe(" WHERE (name = $1)");
		expect(result.orderNumber).toBe(1);
	});

	it("should handle operatorMappings", () => {
		const data = {
			queryArray: [
				{ key: "age", operator: "$between" },
				{ key: "status", operator: "$in" },
			],
		};
		// @ts-expect-error - mock
		const result = getFieldsToSearch(data);

		expect(result.searchFields).toBe(" WHERE (age BETWEEN $1 AND $2 AND status = ANY ($3))");
		expect(result.orderNumber).toBe(3);
	});

	it("should handle queryOrArray", () => {
		const data = {
			queryArray: [{ key: "is_active", operator: "=" }],
			queryOrArray: [
				{ query: [{ key: "name", operator: "=" }] },
				{ query: [{ key: "email", operator: "$like" }] },
			],
		};
		// @ts-expect-error - mock
		const result = getFieldsToSearch(data);

		expect(result.searchFields).toBe(" WHERE (is_active = $1 AND ((name = $2) OR (email LIKE $3)))");
		expect(result.orderNumber).toBe(3);
	});

	it("should handle queryOrArray with multiple conditions in one branch", () => {
		const data = {
			queryArray: [{ key: "is_active", operator: "=" }],
			queryOrArray: [
				{
					query: [
						{ key: "name", operator: "=" },
						{ key: "email", operator: "$like" },
					],
				},
				{ query: [{ key: "phone", operator: "=" }] },
			],
		};
		// @ts-expect-error - mock
		const result = getFieldsToSearch(data);

		expect(result.searchFields).toBe(
			" WHERE (is_active = $1 AND (((name = $2) AND (email LIKE $3)) OR (phone = $4)))",
		);
		expect(result.orderNumber).toBe(4);
	});

	it("should handle pagination", () => {
		const result = getFieldsToSearch({ queryArray: [] }, ["*"], { limit: 10, offset: 5 });

		expect(result.paginationFields).toBe(" LIMIT 10 OFFSET 5");
	});

	it("should handle single order", () => {
		const result = getFieldsToSearch({ queryArray: [] }, ["*"], undefined, { orderBy: "name", ordering: "ASC" });

		expect(result.orderByFields).toBe(" ORDER BY name ASC");
	});

	it("should handle multiple orders", () => {
		const order = [
			{ orderBy: "name", ordering: "ASC" },
			{ orderBy: "age", ordering: "DESC" },
		];
		// @ts-expect-error - mock
		const result = getFieldsToSearch({ queryArray: [] }, ["*"], undefined, order);

		expect(result.orderByFields).toBe(" ORDER BY name ASC, age DESC");
	});

	it("should handle a complex query", () => {
		const data = {
			queryArray: [
				{ key: "category", operator: "=" },
				{ key: "price", operator: "$between" },
			],
			queryOrArray: [
				{ query: [{ key: "tag", operator: "$in" }] },
				{ query: [{ key: "description", operator: "$ilike" }] },
			],
		};
		const selected = ["id", "name", "price"];
		const pagination = { limit: 50, offset: 100 };
		const order = { orderBy: "price", ordering: "DESC" };

		// @ts-expect-error - mock
		const result = getFieldsToSearch(data, selected, pagination, order);

		expect(result.selectedFields).toBe("id, name, price");
		expect(result.searchFields).toBe(" WHERE (category = $1 AND price BETWEEN $2 AND $3 AND ((tag = ANY ($4)) OR (description ILIKE $5)))");
		expect(result.orderNumber).toBe(5);
		expect(result.orderByFields).toBe(" ORDER BY price DESC");
		expect(result.paginationFields).toBe(" LIMIT 50 OFFSET 100");
	});

	it("should handle operator without parameters", () => {
		const data = {
			queryArray: [{ key: "name IS NOT NULL", operator: "$withoutParameters" }],
		};
		// @ts-expect-error - mock
		const result = getFieldsToSearch(data);

		expect(result.searchFields).toBe(" WHERE (name IS NOT NULL)");
		expect(result.orderNumber).toBe(0);
	});
});
