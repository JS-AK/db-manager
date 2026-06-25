import {
	describe,
	expect,
	it,
} from "vitest";

import { buildUpdateSetExpression } from "./build-update-set-expression.js";

describe("buildUpdateSetExpression", () => {
	it("should build operator SQL expressions", () => {
		expect(buildUpdateSetExpression("tokens", "$inc", "?")).toBe("tokens = tokens + ?");
		expect(buildUpdateSetExpression("score", "$mul", "?")).toBe("score = score * ?");
		expect(buildUpdateSetExpression("rating", "$min", "?")).toBe("rating = LEAST(rating, ?)");
		expect(buildUpdateSetExpression("rating", "$max", "?")).toBe("rating = GREATEST(rating, ?)");
		expect(buildUpdateSetExpression("bio", "$concat", "?")).toBe("bio = CONCAT(bio, ?)");
		expect(buildUpdateSetExpression("bio", "$prepend", "?")).toBe("bio = CONCAT(?, bio)");
		expect(buildUpdateSetExpression("name", "$set", "?")).toBe("name = ?");
	});
});
