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
		], 2)).toBe("name = $2,age = $3");
	});

	it("should build inc SQL", () => {
		expect(buildUpdateSetSql([
			{ column: "\"tokens\"", kind: "$inc" },
		], 3)).toBe("\"tokens\" = \"tokens\" + $3");
	});
});
