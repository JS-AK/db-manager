import {
	describe,
	expect,
	it,
} from "vitest";

import { parseUpdateOperatorValue } from "./parse-update-operator-value.js";

describe("parseUpdateOperatorValue", () => {
	it("should parse numeric operators", () => {
		expect(parseUpdateOperatorValue({ $inc: -5 })).toEqual({ kind: "$inc", operand: -5 });
		expect(parseUpdateOperatorValue({ $mul: 1.5 })).toEqual({ kind: "$mul", operand: 1.5 });
		expect(parseUpdateOperatorValue({ $min: 0 })).toEqual({ kind: "$min", operand: 0 });
		expect(parseUpdateOperatorValue({ $max: 100 })).toEqual({ kind: "$max", operand: 100 });
	});

	it("should parse string operators", () => {
		expect(parseUpdateOperatorValue({ $concat: ",tag" })).toEqual({ kind: "$concat", operand: ",tag" });
		expect(parseUpdateOperatorValue({ $prepend: "prefix:" })).toEqual({ kind: "$prepend", operand: "prefix:" });
		expect(parseUpdateOperatorValue({ $min: "a" })).toEqual({ kind: "$min", operand: "a" });
	});

	it("should return null for invalid operator objects", () => {
		expect(parseUpdateOperatorValue({ $inc: "bad" })).toBeNull();
		expect(parseUpdateOperatorValue({ $inc: 1, $mul: 2 })).toBeNull();
		expect(parseUpdateOperatorValue({ name: "John" })).toBeNull();
		expect(parseUpdateOperatorValue(10)).toBeNull();
	});
});
