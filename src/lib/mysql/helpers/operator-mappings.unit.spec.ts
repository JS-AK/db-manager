import {
	describe,
	expect,
	it,
} from "vitest";

import * as Types from "../model/types.js";

import { operatorMappings } from "./operator-mappings.js";

describe("operatorMappings for MySQL", () => {
	it("should process $custom operator", () => {
		const func = operatorMappings.get("$custom");
		const el: Types.TField = { key: "price", operator: "$custom", sign: ">" };
		const result = func?.(el);

		expect(result).toBe("price > ?");
	});

	it("should process $between operator", () => {
		const func = operatorMappings.get("$between");
		const el: Types.TField = { key: "age", operator: "$between" };
		const result = func?.(el);

		expect(result).toBe("age BETWEEN ? AND ?");
	});

	it("should process $in operator", () => {
		const func = operatorMappings.get("$in");
		const el: Types.TField = { key: "status", operator: "$in" };
		const result = func?.(el);

		expect(result).toBe("status IN (?)");
	});

	it("should process $like operator", () => {
		const func = operatorMappings.get("$like");
		const el: Types.TField = { key: "name", operator: "$like" };
		const result = func?.(el);

		expect(result).toBe("name LIKE ?");
	});

	it("should process $ilike operator", () => {
		const func = operatorMappings.get("$ilike");
		const el: Types.TField = { key: "email", operator: "$ilike" };
		const result = func?.(el);

		expect(result).toBe("LOWER(email) LIKE LOWER(?)");
	});

	it("should process $nin operator", () => {
		const func = operatorMappings.get("$nin");
		const el: Types.TField = { key: "id", operator: "$nin" };
		const result = func?.(el);

		expect(result).toBe("id NOT IN (?)");
	});

	it("should process $nbetween operator", () => {
		const func = operatorMappings.get("$nbetween");
		const el: Types.TField = { key: "date", operator: "$nbetween" };
		const result = func?.(el);

		expect(result).toBe("date NOT BETWEEN ? AND ?");
	});

	it("should process $nlike operator", () => {
		const func = operatorMappings.get("$nlike");
		const el: Types.TField = { key: "comment", operator: "$nlike" };
		const result = func?.(el);

		expect(result).toBe("comment NOT LIKE ?");
	});

	it("should process $nilike operator", () => {
		const func = operatorMappings.get("$nilike");
		const el: Types.TField = { key: "comment", operator: "$nilike" };
		const result = func?.(el);

		expect(result).toBe("LOWER(comment) NOT LIKE LOWER(?)");
	});

	it("should process $withoutParameters operator", () => {
		const func = operatorMappings.get("$withoutParameters");
		const el: Types.TField = { key: "name IS NOT NULL", operator: "$withoutParameters" };
		const result = func?.(el);

		expect(result).toBe("name IS NOT NULL");
	});
});
