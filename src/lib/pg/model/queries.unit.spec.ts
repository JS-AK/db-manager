import {
	describe,
	expect,
	it,
} from "vitest";

import queries, { generateTimestampQuery } from "./queries.js";

describe("generateTimestampQuery", () => {
	it("should return NOW() for timestamp", () => {
		expect(generateTimestampQuery("timestamp")).toBe("NOW()");
	});

	it("should return unix timestamp expression for unix_timestamp", () => {
		expect(generateTimestampQuery("unix_timestamp")).toBe(
			"ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))",
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

		expect(query).toBe("INSERT INTO users (name,age) VALUES ($1,$2)  RETURNING *;");
	});

	it("should build INSERT for multiple rows with sequential placeholders", () => {
		const query = queries.createMany({
			fields: [["a", "b"], ["c", "d"]],
			headers: ["name", "age"],
			onConflict: "ON CONFLICT DO NOTHING",
			returning: ["id", "name"],
			tableName: "users",
		});

		expect(query).toBe(
			"INSERT INTO users (name,age) VALUES ($1,$2),($3,$4) ON CONFLICT DO NOTHING RETURNING id,name;",
		);
	});

	it("should preserve quoted SQL identifiers in headers", () => {
		const query = queries.createMany({
			fields: [["x"]],
			headers: ["\"typeID\""],
			onConflict: "",
			tableName: "invTypes",
		});

		expect(query).toBe("INSERT INTO invTypes (\"typeID\") VALUES ($1)  RETURNING *;");
	});
});

describe("queries.createOne", () => {
	it("should build INSERT for provided fields", () => {
		const query = queries.createOne("\"users\"", ["\"name\"", "\"age\""], undefined, undefined);

		expect(query).toBe("INSERT INTO \"users\" (\"name\",\"age\") VALUES ($1,$2)  RETURNING *;");
	});

	it("should append timestamp createField", () => {
		const query = queries.createOne(
			"\"users\"",
			["\"name\""],
			{ title: "\"created_at\"", type: "timestamp" },
			"ON CONFLICT DO NOTHING",
			["\"id\""],
		);

		expect(query).toBe(
			"INSERT INTO \"users\" (\"name\",\"created_at\") VALUES ($1,NOW()) ON CONFLICT DO NOTHING RETURNING \"id\";",
		);
	});

	it("should append unix_timestamp createField", () => {
		const query = queries.createOne(
			"\"users\"",
			["\"name\""],
			{ title: "\"created_at\"", type: "unix_timestamp" },
			"",
		);

		expect(query).toBe(
			"INSERT INTO \"users\" (\"name\",\"created_at\") VALUES ($1,ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)))  RETURNING *;",
		);
	});

	it("should throw for invalid createField type", () => {
		expect(() => queries.createOne(
			"\"users\"",
			["\"name\""],
			{ title: "\"created_at\"", type: "invalid" as "timestamp" },
			"",
		)).toThrow("Invalid type: invalid");
	});
});

describe("queries.deleteAll", () => {
	it("should build DELETE without WHERE", () => {
		expect(queries.deleteAll("\"users\"")).toBe("DELETE FROM \"users\";");
	});
});

describe("queries.deleteByParams", () => {
	it("should append searchFields to DELETE", () => {
		const query = queries.deleteByParams("\"users\"", " WHERE (\"name\" = $1)");

		expect(query).toBe("DELETE FROM \"users\" WHERE (\"name\" = $1);");
	});
});

describe("queries.deleteByPk", () => {
	it("should build DELETE by single primary key", () => {
		expect(queries.deleteByPk("\"users\"", "\"id\"")).toBe(
			"DELETE FROM \"users\" WHERE \"id\" = $1 RETURNING \"id\";",
		);
	});

	it("should build DELETE by composite primary key", () => {
		expect(queries.deleteByPk("\"users\"", ["\"tenant_id\"", "\"user_id\""])).toBe(
			"DELETE FROM \"users\" WHERE \"tenant_id\" = $1 AND \"user_id\" = $2 RETURNING \"tenant_id\", \"user_id\";",
		);
	});
});

describe("queries.getByParams", () => {
	it("should build SELECT with all clauses", () => {
		const query = queries.getByParams(
			"\"users\"",
			"\"id\", \"name\"",
			" WHERE (\"active\" = $1)",
			" ORDER BY \"name\" ASC",
			" LIMIT 10 OFFSET 0",
		);

		expect(query).toBe(
			"SELECT \"id\", \"name\" FROM \"users\" WHERE (\"active\" = $1) ORDER BY \"name\" ASC LIMIT 10 OFFSET 0;",
		);
	});
});

describe("queries.getCountByCompositePks", () => {
	it("should build COUNT with OR-ed composite PK conditions", () => {
		const query = queries.getCountByCompositePks(["\"tenant_id\"", "\"user_id\""], "\"users\"", 2);

		expect(query).toBe(
			"SELECT COUNT(*) AS count FROM \"users\" WHERE ((\"tenant_id\" = $1 AND \"user_id\" = $2) OR (\"tenant_id\" = $3 AND \"user_id\" = $4));",
		);
	});
});

describe("queries.getCountByCompositePksAndParams", () => {
	it("should append composite PK conditions after searchFields", () => {
		const query = queries.getCountByCompositePksAndParams(
			["tenant_id", "user_id"],
			"users",
			" WHERE (active = $1)",
			2,
			1,
		);

		expect(query).toBe(
			"SELECT COUNT(*) AS count FROM users  WHERE (active = $1) AND ((tenant_id = $3 AND user_id = $4));",
		);
	});
});

describe("queries.getCountByParams", () => {
	it("should build COUNT with searchFields", () => {
		expect(queries.getCountByParams("users", " WHERE (active = $1)")).toBe(
			"SELECT COUNT(*) AS count FROM users WHERE (active = $1);",
		);
	});
});

describe("queries.getCountByPks", () => {
	it("should build COUNT with ANY for primary key list", () => {
		expect(queries.getCountByPks("id", "users")).toBe(
			"SELECT COUNT(*) AS count FROM users WHERE id = ANY ($1);",
		);
	});
});

describe("queries.getCountByPksAndParams", () => {
	it("should combine searchFields and ANY primary key filter", () => {
		const query = queries.getCountByPksAndParams("id", "users", " WHERE (active = $1)", 2);

		expect(query).toBe(
			"SELECT COUNT(*) AS count FROM users WHERE (active = $1) AND id = ANY ($3);",
		);
	});
});

describe("queries.getOneByPk", () => {
	it("should build SELECT by single primary key", () => {
		expect(queries.getOneByPk("users", "id")).toBe(
			"SELECT * FROM users WHERE id = $1 LIMIT 1;",
		);
	});

	it("should build SELECT by composite primary key", () => {
		expect(queries.getOneByPk("users", ["tenant_id", "user_id"])).toBe(
			"SELECT * FROM users WHERE tenant_id = $1 AND user_id = $2 LIMIT 1;",
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
			" WHERE (id = $1)",
			undefined,
			2,
		);

		expect(query).toBe("UPDATE users SET name = $2,age = $3 WHERE (id = $1) RETURNING *;");
	});

	it("should build UPDATE with $inc clause", () => {
		const query = queries.updateByParams(
			"users",
			[{ column: "tokens", kind: "$inc" }],
			" WHERE (\"id\" = $1 AND \"tokens\" >= $2)",
			undefined,
			3,
		);

		expect(query).toBe(
			"UPDATE users SET tokens = tokens + $3 WHERE (\"id\" = $1 AND \"tokens\" >= $2) RETURNING *;",
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
			" WHERE (id = $1)",
			undefined,
			2,
		);

		expect(query).toBe(
			"UPDATE users SET score = score * $2,rating = GREATEST(rating, $3),bio = bio || $4 WHERE (id = $1) RETURNING *;",
		);
	});

	it("should append timestamp updateField", () => {
		const query = queries.updateByParams(
			"users",
			[{ column: "name", kind: "$set" }],
			" WHERE (id = $1)",
			{ title: "updated_at", type: "timestamp" },
			2,
			["id", "name"],
		);

		expect(query).toBe(
			"UPDATE users SET name = $2, updated_at = NOW() WHERE (id = $1) RETURNING id,name;",
		);
	});

	it("should append unix_timestamp updateField", () => {
		const query = queries.updateByParams(
			"users",
			[{ column: "name", kind: "$set" }],
			" WHERE (id = $1)",
			{ title: "updated_at", type: "unix_timestamp" },
			2,
		);

		expect(query).toBe(
			"UPDATE users SET name = $2, updated_at = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)) WHERE (id = $1) RETURNING *;",
		);
	});

	it("should throw for invalid updateField type", () => {
		expect(() => queries.updateByParams(
			"users",
			[{ column: "name", kind: "$set" }],
			" WHERE (id = $1)",
			{ title: "updated_at", type: "invalid" as "timestamp" },
			2,
		)).toThrow("Invalid type: invalid");
	});
});

describe("queries.updateByPk", () => {
	it("should build UPDATE by single primary key", () => {
		const query = queries.updateByPk("users", [{ column: "name", kind: "$set" }], "id", undefined, ["id", "name"]);

		expect(query).toBe("UPDATE users SET name = $1 WHERE id = $2 RETURNING id,name;");
	});

	it("should build UPDATE with $inc by primary key", () => {
		const query = queries.updateByPk("users", [{ column: "tokens", kind: "$inc" }], "id");

		expect(query).toBe("UPDATE users SET tokens = tokens + $1 WHERE id = $2 RETURNING *;");
	});

	it("should build UPDATE by composite primary key", () => {
		const query = queries.updateByPk(
			"users",
			[{ column: "name", kind: "$set" }],
			["tenant_id", "user_id"],
			{ title: "updated_at", type: "timestamp" },
		);

		expect(query).toBe(
			"UPDATE users SET name = $1, updated_at = NOW() WHERE tenant_id = $2 AND user_id = $3 RETURNING *;",
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
