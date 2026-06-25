import {
	describe,
	expect,
	it,
} from "vitest";

import { buildUpdateSetSql } from "./build-update-set-sql.js";

describe("buildUpdateSetSql", () => {
	it("should build set SQL", () => {
		expect(buildUpdateSetSql([
			{ column: "name", kind: "$set" },
			{ column: "age", kind: "$set" },
		])).toBe("name = ?,age = ?");
	});

	it("should build inc SQL", () => {
		expect(buildUpdateSetSql([
			{ column: "`tokens`", kind: "$inc" },
		])).toBe("`tokens` = `tokens` + ?");
	});
});
