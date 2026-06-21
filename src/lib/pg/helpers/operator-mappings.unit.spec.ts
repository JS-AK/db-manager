import {
	describe,
	expect,
	it,
} from "vitest";

import * as Types from "../model/types.js";

import { operatorMappings } from "./operator-mappings.js";

describe("operatorMappings", () => {
	it("should process $custom operator", () => {
		const func = operatorMappings.get("$custom");
		const el: Types.TField = { key: "price", operator: "$custom", sign: ">" };
		const result = func?.(el, 0);

		expect(result).toEqual(["price > $1", 1]);
	});

	it("should process $between operator", () => {
		const func = operatorMappings.get("$between");
		const el: Types.TField = { key: "age", operator: "$between" };
		const result = func?.(el, 1);

		expect(result).toEqual(["age BETWEEN $2 AND $3", 3]);
	});

	it("should process $in operator", () => {
		const func = operatorMappings.get("$in");
		const el: Types.TField = { key: "status", operator: "$in" };
		const result = func?.(el, 3);

		expect(result).toEqual(["status = ANY ($4)", 4]);
	});

	it("should process $like operator", () => {
		const func = operatorMappings.get("$like");
		const el: Types.TField = { key: "name", operator: "$like" };
		const result = func?.(el, 0);

		expect(result).toEqual(["name LIKE $1", 1]);
	});

	it("should process $ilike operator", () => {
		const func = operatorMappings.get("$ilike");
		const el: Types.TField = { key: "email", operator: "$ilike" };
		const result = func?.(el, 0);

		expect(result).toEqual(["email ILIKE $1", 1]);
	});

	it("should process $nin operator", () => {
		const func = operatorMappings.get("$nin");
		const el: Types.TField = { key: "id", operator: "$nin" };
		const result = func?.(el, 5);

		expect(result).toEqual(["NOT (id = ANY ($6))", 6]);
	});

	it("should process $nbetween operator", () => {
		const func = operatorMappings.get("$nbetween");
		const el: Types.TField = { key: "date", operator: "$nbetween" };
		const result = func?.(el, 0);

		expect(result).toEqual(["date NOT BETWEEN $1 AND $2", 2]);
	});

	it("should process $nlike operator", () => {
		const func = operatorMappings.get("$nlike");
		const el: Types.TField = { key: "comment", operator: "$nlike" };
		const result = func?.(el, 2);

		expect(result).toEqual(["comment NOT LIKE $3", 3]);
	});

	it("should process $nilike operator", () => {
		const func = operatorMappings.get("$nilike");
		const el: Types.TField = { key: "comment", operator: "$nilike" };
		const result = func?.(el, 4);

		expect(result).toEqual(["comment NOT ILIKE $5", 5]);
	});

	it("should process $withoutParameters operator", () => {
		const func = operatorMappings.get("$withoutParameters");
		const el: Types.TField = { key: "name IS NOT NULL", operator: "$withoutParameters" };
		const result = func?.(el, 10);

		expect(result).toEqual(["name IS NOT NULL", 10]);
	});
});
