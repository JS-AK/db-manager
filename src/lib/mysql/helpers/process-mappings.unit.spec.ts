import {
	describe,
	expect,
	it,
} from "vitest";

import * as Types from "../model/types.js";

import { processMappings } from "./process-mappings.js";

describe("processMappings for MySQL", () => {
	it("should process $custom operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$custom");

		func?.("field", { $custom: { sign: ">", value: 10 } }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$custom", sign: ">" }]);
		expect(values).toEqual([10]);
	});

	it("should process $eq operator with a value", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$eq");

		func?.("field", { $eq: "value" }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "=" }]);
		expect(values).toEqual(["value"]);
	});

	it("should process $eq operator with null", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$eq");

		func?.("field", { $eq: null }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field IS NULL", operator: "$withoutParameters" }]);
		expect(values).toEqual([]);
	});

	it("should process $gt operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$gt");

		func?.("field", { $gt: 10 }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: ">" }]);
		expect(values).toEqual([10]);
	});

	it("should process $gte operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$gte");

		func?.("field", { $gte: 10 }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: ">=" }]);
		expect(values).toEqual([10]);
	});

	it("should process $in operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$in");

		func?.("field", { $in: [1, 2, 3] }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$in" }]);
		expect(values).toEqual([[1, 2, 3]]);
	});

	it("should process $json operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$json");

		func?.("field", { $json: { a: 1 } }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$json" }]);
		expect(values).toEqual(["{\"a\":1}"]);
	});

	it("should process $like operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$like");

		func?.("field", { $like: "%pattern%" }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$like" }]);
		expect(values).toEqual(["%pattern%"]);
	});

	it("should process $ilike operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$ilike");

		func?.("field", { $ilike: "%pattern%" }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$ilike" }]);
		expect(values).toEqual(["%pattern%"]);
	});

	it("should process $lt operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$lt");

		func?.("field", { $lt: 10 }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "<" }]);
		expect(values).toEqual([10]);
	});

	it("should process $lte operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$lte");

		func?.("field", { $lte: 10 }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "<=" }]);
		expect(values).toEqual([10]);
	});

	it("should process $ne operator with a value", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$ne");

		func?.("field", { $ne: "value" }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "<>" }]);
		expect(values).toEqual(["value"]);
	});

	it("should process $ne operator with null", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$ne");

		func?.("field", { $ne: null }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field IS NOT NULL", operator: "$withoutParameters" }]);
		expect(values).toEqual([]);
	});

	it("should process $nin operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$nin");

		func?.("field", { $nin: [1, 2, 3] }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$nin" }]);
		expect(values).toEqual([[1, 2, 3]]);
	});

	it("should process $between operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$between");

		func?.("field", { $between: [1, 10] }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$between" }]);
		expect(values).toEqual([1, 10]);
	});

	it("should process $nbetween operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$nbetween");

		func?.("field", { $nbetween: [1, 10] }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$nbetween" }]);
		expect(values).toEqual([1, 10]);
	});

	it("should process $nlike operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$nlike");

		func?.("field", { $nlike: "%pattern%" }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$nlike" }]);
		expect(values).toEqual(["%pattern%"]);
	});

	it("should process $nilike operator", () => {
		const queryArray: Types.TField[] = [];
		const values: unknown[] = [];
		const func = processMappings.get("$nilike");

		func?.("field", { $nilike: "%pattern%" }, queryArray, values);
		expect(queryArray).toEqual([{ key: "field", operator: "$nilike" }]);
		expect(values).toEqual(["%pattern%"]);
	});
});
