import {
	describe,
	expect,
	it,
} from "vitest";

import { buildUpdateSetExpression } from "./build-update-set-expression.js";

describe("buildUpdateSetExpression", () => {
	it("should build operator SQL expressions", () => {
		expect(buildUpdateSetExpression("tokens", "$inc", "$1")).toBe("tokens = tokens + $1");
		expect(buildUpdateSetExpression("score", "$mul", "$2")).toBe("score = score * $2");
		expect(buildUpdateSetExpression("rating", "$min", "$3")).toBe("rating = LEAST(rating, $3)");
		expect(buildUpdateSetExpression("rating", "$max", "$4")).toBe("rating = GREATEST(rating, $4)");
		expect(buildUpdateSetExpression("bio", "$concat", "$5")).toBe("bio = bio || $5");
		expect(buildUpdateSetExpression("bio", "$prepend", "$6")).toBe("bio = $6 || bio");
		expect(buildUpdateSetExpression("name", "$set", "$7")).toBe("name = $7");
	});
});
