import {
	describe,
	expect,
	it,
} from "vitest";

import { compareFields } from "./compare-fields.js";

describe("compareFields", () => {
	it("should process simple equality params", () => {
		const params = { age: 30, name: "John" };
		const result = compareFields(params);

		expect(result.queryArray).toEqual([
			{ key: "age", operator: "=" },
			{ key: "name", operator: "=" },
		]);
		expect(result.values).toEqual([30, "John"]);
		expect(result.queryOrArray).toEqual([]);
	});

	it("should handle null values correctly", () => {
		const params = { name: null };
		const result = compareFields(params);

		expect(result.queryArray).toEqual([{ key: "name IS NULL", operator: "$withoutParameters" }]);
		expect(result.values).toEqual([]);
	});

	it("should ignore undefined values", () => {
		const params = { age: undefined, name: "John" };
		const result = compareFields(params);

		expect(result.queryArray).toEqual([{ key: "name", operator: "=" }]);
		expect(result.values).toEqual(["John"]);
	});

	it("should use processMappings for object values", () => {
		const params = { age: { $gt: 25 } };
		const result = compareFields(params);

		expect(result.queryArray).toEqual([{ key: "age", operator: ">" }]);
		expect(result.values).toEqual([25]);
	});

	it("should handle an array of operators for the same key", () => {
		const params = {
			age: [{ $gt: 25 }, { $in: [30, 40] }],
		};
		const result = compareFields(params);

		expect(result.queryArray).toEqual([
			{ key: "age", operator: ">" },
			{ key: "age", operator: "$in" },
		]);
		expect(result.values).toEqual([25, [30, 40]]);
	});

	it("should throw an error for invalid operator", () => {
		const params = { age: { $invalidOp: 25 } };
		const availableKeys = "$custom,$eq,$gt,$gte,$in,$json,$like,$ilike,$lt,$lte,$ne,$nin,$between,$nbetween,$nlike,$nilike";

		expect(() => compareFields(params)).toThrow(`Invalid value.key $invalidOp, Available values: ${availableKeys}`);
	});

	it("should process paramsOr correctly", () => {
		const paramsOr = [{ name: "John" }, { age: { $gt: 30 } }];
		const result = compareFields({}, paramsOr);

		expect(result.queryArray).toEqual([]);
		expect(result.queryOrArray).toEqual([
			{ query: [{ key: "name", operator: "=" }] },
			{ query: [{ key: "age", operator: ">" }] },
		]);
		expect(result.values).toEqual(["John", 30]);
	});

	it("should throw an error if paramsOr has less than 2 elements", () => {
		const paramsOr = [{ name: "John" }];

		expect(() => compareFields({}, paramsOr)).toThrow("The minimum length of the paramsOr array must be 2");
	});

	it("should throw an error for empty object in paramsOr", () => {
		const paramsOr = [{ name: "John" }, {}];

		expect(() => compareFields({}, paramsOr)).toThrow("Empty object in one of the array elements");
	});

	it("should process both params and paramsOr", () => {
		const params = { status: "active" };
		const paramsOr = [{ name: "John" }, { age: 30 }];
		const result = compareFields(params, paramsOr);

		expect(result.queryArray).toEqual([{ key: "status", operator: "=" }]);
		expect(result.queryOrArray).toEqual([
			{ query: [{ key: "name", operator: "=" }] },
			{ query: [{ key: "age", operator: "=" }] },
		]);
		expect(result.values).toEqual(["active", "John", 30]);
	});
});
