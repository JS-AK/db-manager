import {
	describe,
	expect,
	it,
} from "vitest";

import { prepareUpdateFields } from "./prepare-update-fields.js";

describe("prepareUpdateFields", () => {
	it("should build set clauses for plain values", () => {
		const result = prepareUpdateFields(
			{ age: 31, name: "John" },
			{ tableFieldsSet: new Set(["age", "name"]) },
		);

		expect(result.clauses).toEqual([
			{ column: "`age`", kind: "$set" },
			{ column: "`name`", kind: "$set" },
		]);
		expect(result.values).toEqual([31, "John"]);
	});

	it("should build operator clauses", () => {
		const result = prepareUpdateFields(
			{
				bio: { $concat: " updated" },
				rating: { $max: 5 },
				score: { $mul: 1.1 },
				tokens: { $inc: -3 },
			},
			{ tableFieldsSet: new Set(["bio", "rating", "score", "tokens"]) },
		);

		expect(result.clauses).toEqual([
			{ column: "`bio`", kind: "$concat" },
			{ column: "`rating`", kind: "$max" },
			{ column: "`score`", kind: "$mul" },
			{ column: "`tokens`", kind: "$inc" },
		]);
		expect(result.values).toEqual([" updated", 5, 1.1, -3]);
	});

	it("should use raw column names when rawColumns is true", () => {
		const result = prepareUpdateFields(
			{ tokens: { $inc: -5 } },
			{ rawColumns: true },
		);

		expect(result.clauses).toEqual([
			{ column: "tokens", kind: "$inc" },
		]);
		expect(result.values).toEqual([-5]);
	});
});
