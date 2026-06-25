import {
	describe,
	expect,
	it,
} from "vitest";

import { QueryHandler } from "./query-handler.js";

const defaultOptions = {
	dataSourcePrepared: "users",
	dataSourceRaw: "users",
};

describe("QueryHandler", () => {
	describe("update", () => {
		it("should construct an UPDATE query", () => {
			const qh = new QueryHandler(defaultOptions);
			const params = { age: 31, name: "John Doe" };

			qh.update({ params });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("UPDATE users SET age = ?,name = ?;");
			expect(values).toEqual([31, "John Doe"]);
		});

		it("should construct an UPDATE query with $inc", () => {
			const qh = new QueryHandler(defaultOptions);
			const params = { tokens: { $inc: -5 } };

			qh.update({ params });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("UPDATE users SET tokens = tokens + ?;");
			expect(values).toEqual([-5]);
		});

		it("should construct an UPDATE query with other operators", () => {
			const qh = new QueryHandler(defaultOptions);
			const params = {
				bio: { $concat: " updated" },
				rating: { $max: 5 },
				score: { $mul: 1.1 },
			};

			qh.update({ params });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("UPDATE users SET bio = CONCAT(bio, ?),rating = GREATEST(rating, ?),score = score * ?;");
			expect(values).toEqual([" updated", 5, 1.1]);
		});
	});
});
