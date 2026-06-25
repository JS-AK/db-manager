import {
	describe, expect, it,
} from "vitest";

import { normalizeMysqlBindValue } from "./normalize-mysql-bind-value.js";

describe("normalizeMysqlBindValue", () => {
	it("should stringify objects and arrays", () => {
		expect(normalizeMysqlBindValue({ firstName: "John" })).toBe("{\"firstName\":\"John\"}");
		expect(normalizeMysqlBindValue(["a", "b"])).toBe("[\"a\",\"b\"]");
	});

	it("should keep scalars, null and dates unchanged", () => {
		const date = new Date("2020-01-01T00:00:00.000Z");

		expect(normalizeMysqlBindValue("title")).toBe("title");
		expect(normalizeMysqlBindValue(1)).toBe(1);
		expect(normalizeMysqlBindValue(null)).toBeNull();
		expect(normalizeMysqlBindValue(date)).toBe(date);
	});
});
