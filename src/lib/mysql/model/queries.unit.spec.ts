import {
	describe,
	expect,
	it,
} from "vitest";

import queries, { generateTimestampQuery } from "./queries.js";

describe("generateTimestampQuery", () => {
	it("should return UTC_TIMESTAMP() for timestamp", () => {
		expect(generateTimestampQuery("timestamp")).toBe("UTC_TIMESTAMP()");
	});

	it("should return unix timestamp expression for unix_timestamp", () => {
		expect(generateTimestampQuery("unix_timestamp")).toBe(
			"ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)",
		);
	});

	it("should throw for invalid type", () => {
		expect(() => generateTimestampQuery("invalid" as "timestamp")).toThrow("Invalid type: invalid");
	});
});

describe("queries.createMany", () => {
	it("should build INSERT for a single row", () => {
		const query = queries.createMany({
			fields: [["a", "b"]],
			headers: ["name", "age"],
			onConflict: "",
			tableName: "users",
		});

		expect(query).toBe("INSERT INTO users (name,age) VALUES (?,?) ;");
	});

	it("should build INSERT for multiple rows with placeholders", () => {
		const query = queries.createMany({
			fields: [["a", "b"], ["c", "d"]],
			headers: ["name", "age"],
			onConflict: "ON DUPLICATE KEY UPDATE name = VALUES(name)",
			tableName: "users",
		});

		expect(query).toBe(
			"INSERT INTO users (name,age) VALUES (?,?),(?,?) ON DUPLICATE KEY UPDATE name = VALUES(name);",
		);
	});

	it("should preserve quoted SQL identifiers in headers", () => {
		const query = queries.createMany({
			fields: [["x"]],
			headers: ["`typeID`"],
			onConflict: "",
			tableName: "invTypes",
		});

		expect(query).toBe("INSERT INTO invTypes (`typeID`) VALUES (?) ;");
	});
});

describe("queries.createOne", () => {
	it("should build INSERT for provided fields", () => {
		const query = queries.createOne("`users`", ["`name`", "`age`"], null, "");

		expect(query).toBe("INSERT INTO `users` (`name`,`age`) VALUES (?,?) ;");
	});

	it("should append timestamp createField", () => {
		const query = queries.createOne(
			"`users`",
			["`name`"],
			{ title: "`created_at`", type: "timestamp" },
			"ON DUPLICATE KEY UPDATE name = VALUES(name)",
		);

		expect(query).toBe(
			"INSERT INTO `users` (`name`,`created_at`) VALUES (?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE name = VALUES(name);",
		);
	});

	it("should append unix_timestamp createField", () => {
		const query = queries.createOne(
			"`users`",
			["`name`"],
			{ title: "`created_at`", type: "unix_timestamp" },
			"",
		);

		expect(query).toBe(
			"INSERT INTO `users` (`name`,`created_at`) VALUES (?,ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)) ;",
		);
	});

	it("should throw for invalid createField type", () => {
		expect(() => queries.createOne(
			"`users`",
			["`name`"],
			{ title: "`created_at`", type: "invalid" as "timestamp" },
			"",
		)).toThrow("Invalid type: invalid");
	});
});

describe("queries.deleteAll", () => {
	it("should build DELETE without WHERE", () => {
		expect(queries.deleteAll("`users`")).toBe("DELETE FROM `users`;");
	});
});

describe("queries.deleteByParams", () => {
	it("should append searchFields to DELETE", () => {
		const query = queries.deleteByParams("`users`", " WHERE (`name` = ?)");

		expect(query).toBe("DELETE FROM `users` WHERE (`name` = ?);");
	});
});

describe("queries.deleteByPk", () => {
	it("should build DELETE by single primary key", () => {
		expect(queries.deleteByPk("`users`", "`id`")).toBe(
			"DELETE FROM `users` WHERE `id` = ?;",
		);
	});

	it("should build DELETE by composite primary key", () => {
		expect(queries.deleteByPk("`users`", ["`tenant_id`", "`user_id`"])).toBe(
			"DELETE FROM `users` WHERE `tenant_id` = ? AND `user_id` = ?;",
		);
	});
});

describe("queries.getByParams", () => {
	it("should build SELECT with all clauses", () => {
		const query = queries.getByParams(
			"`users`",
			"`id`, `name`",
			" WHERE (`active` = ?)",
			" ORDER BY `name` ASC",
			" LIMIT 10 OFFSET 0",
		);

		expect(query).toBe(
			"SELECT `id`, `name` FROM `users` WHERE (`active` = ?) ORDER BY `name` ASC LIMIT 10 OFFSET 0;",
		);
	});
});

describe("queries.getCountByCompositePks", () => {
	it("should build COUNT with OR-ed composite PK conditions", () => {
		const query = queries.getCountByCompositePks(["`tenant_id`", "`user_id`"], "`users`", 2);

		expect(query).toBe(
			"SELECT COUNT(*) AS count FROM `users` WHERE (`tenant_id` = ? AND `user_id` = ?) OR (`tenant_id` = ? AND `user_id` = ?);",
		);
	});
});

describe("queries.getCountByCompositePksAndParams", () => {
	it("should append composite PK conditions after searchFields", () => {
		const query = queries.getCountByCompositePksAndParams(
			["tenant_id", "user_id"],
			"users",
			" WHERE (active = ?)",
			1,
		);

		expect(query).toBe(
			"SELECT COUNT(*) AS count FROM users  WHERE (active = ?) AND ((tenant_id = ? AND user_id = ?));",
		);
	});
});

describe("queries.getCountByParams", () => {
	it("should build COUNT with searchFields", () => {
		expect(queries.getCountByParams("users", " WHERE (active = ?)")).toBe(
			"SELECT COUNT(*) AS count FROM users WHERE (active = ?);",
		);
	});
});

describe("queries.getCountByPks", () => {
	it("should build COUNT with IN for primary key list", () => {
		expect(queries.getCountByPks("id", "users")).toBe(
			"SELECT COUNT(*) AS count FROM users WHERE id IN (?);",
		);
	});
});

describe("queries.getCountByPksAndParams", () => {
	it("should combine searchFields and IN primary key filter", () => {
		const query = queries.getCountByPksAndParams("id", "users", " WHERE (active = ?)");

		expect(query).toBe(
			"SELECT COUNT(*) AS count FROM users WHERE (active = ?) AND id IN (?);",
		);
	});
});

describe("queries.getOneByPk", () => {
	it("should build SELECT by single primary key", () => {
		expect(queries.getOneByPk("users", "id")).toBe(
			"SELECT * FROM users WHERE id = ? LIMIT 1;",
		);
	});

	it("should build SELECT by composite primary key", () => {
		expect(queries.getOneByPk("users", ["tenant_id", "user_id"])).toBe(
			"SELECT * FROM users WHERE tenant_id = ? AND user_id = ? LIMIT 1;",
		);
	});
});

describe("queries.updateByParams", () => {
	it("should build UPDATE with parameterized SET clause", () => {
		const query = queries.updateByParams(
			"users",
			[
				{ column: "name", kind: "$set" },
				{ column: "age", kind: "$set" },
			],
			" WHERE (id = ?)",
			null,
		);

		expect(query).toBe("UPDATE users SET name = ?,age = ? WHERE (id = ?);");
	});

	it("should build UPDATE with $inc clause", () => {
		const query = queries.updateByParams(
			"users",
			[{ column: "tokens", kind: "$inc" }],
			" WHERE (`id` = ? AND tokens >= ?)",
			null,
		);

		expect(query).toBe(
			"UPDATE users SET tokens = tokens + ? WHERE (`id` = ? AND tokens >= ?);",
		);
	});

	it("should build UPDATE with other operator clauses", () => {
		const query = queries.updateByParams(
			"users",
			[
				{ column: "score", kind: "$mul" },
				{ column: "rating", kind: "$max" },
				{ column: "bio", kind: "$concat" },
			],
			" WHERE (id = ?)",
			null,
		);

		expect(query).toBe(
			"UPDATE users SET score = score * ?,rating = GREATEST(rating, ?),bio = CONCAT(bio, ?) WHERE (id = ?);",
		);
	});

	it("should append timestamp updateField", () => {
		const query = queries.updateByParams(
			"users",
			[{ column: "name", kind: "$set" }],
			" WHERE (id = ?)",
			{ title: "updated_at", type: "timestamp" },
		);

		expect(query).toBe(
			"UPDATE users SET name = ?, updated_at = UTC_TIMESTAMP() WHERE (id = ?);",
		);
	});

	it("should append unix_timestamp updateField", () => {
		const query = queries.updateByParams(
			"users",
			[{ column: "name", kind: "$set" }],
			" WHERE (id = ?)",
			{ title: "updated_at", type: "unix_timestamp" },
		);

		expect(query).toBe(
			"UPDATE users SET name = ?, updated_at = ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000) WHERE (id = ?);",
		);
	});

	it("should throw for invalid updateField type", () => {
		expect(() => queries.updateByParams(
			"users",
			[{ column: "name", kind: "$set" }],
			" WHERE (id = ?)",
			{ title: "updated_at", type: "invalid" as "timestamp" },
		)).toThrow("Invalid type: invalid");
	});
});

describe("queries.updateByPk", () => {
	it("should build UPDATE by single primary key", () => {
		const query = queries.updateByPk("users", [{ column: "name", kind: "$set" }], "id", null);

		expect(query).toBe("UPDATE users SET name = ? WHERE id = ?;");
	});

	it("should build UPDATE with $inc by primary key", () => {
		const query = queries.updateByPk("users", [{ column: "tokens", kind: "$inc" }], "id", null);

		expect(query).toBe("UPDATE users SET tokens = tokens + ? WHERE id = ?;");
	});

	it("should build UPDATE by composite primary key", () => {
		const query = queries.updateByPk(
			"users",
			[{ column: "name", kind: "$set" }],
			["tenant_id", "user_id"],
			{ title: "updated_at", type: "timestamp" },
		);

		expect(query).toBe(
			"UPDATE users SET name = ?, updated_at = UTC_TIMESTAMP() WHERE tenant_id = ? AND user_id = ?;",
		);
	});

	it("should throw for invalid updateField type", () => {
		expect(() => queries.updateByPk(
			"users",
			[{ column: "name", kind: "$set" }],
			"id",
			{ title: "updated_at", type: "invalid" as "timestamp" },
		)).toThrow("Invalid type: invalid");
	});
});
