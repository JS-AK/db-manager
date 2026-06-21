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
	describe("Basic Statements", () => {
		it("should construct a simple SELECT query", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["id", "name"]);
			const { query, values } = qh.compareQuery();

			expect(query).toBe("SELECT id, name FROM users;");
			expect(values).toEqual([]);
		});

		it("should construct a simple DELETE query", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.delete();
			const { query, values } = qh.compareQuery();

			expect(query).toBe("DELETE FROM users;");
			expect(values).toEqual([]);
		});

		it("should construct an INSERT query for a single object", () => {
			const qh = new QueryHandler(defaultOptions);
			const params = { email: "john@example.com", name: "John" };

			qh.insert({ params });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("INSERT INTO users(email,name) VALUES($1,$2);");
			expect(values).toEqual(["john@example.com", "John"]);
		});

		it("should construct an UPDATE query", () => {
			const qh = new QueryHandler(defaultOptions);
			const params = { age: 31, name: "John Doe" };

			qh.update({ params });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("UPDATE users SET age = $1,name = $2;");
			expect(values).toEqual([31, "John Doe"]);
		});
	});

	describe("Clauses", () => {
		it("should handle FROM clause with alias", () => {
			const qh = new QueryHandler({ dataSourcePrepared: "old", dataSourceRaw: "old" });

			qh.select(["id"]);
			qh.from("profiles as p");
			const { query } = qh.compareQuery();

			expect(query).toBe("SELECT id FROM profiles as p;");
		});

		it("should handle WHERE clause with params", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["*"]);
			qh.where({ params: { id: 1, name: "test" } });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users WHERE (id = $1 AND name = $2);");
			expect(values).toEqual([1, "test"]);
		});

		it("should handle WHERE clause with paramsOr", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["*"]);
			qh.where({ paramsOr: [{ id: 1 }, { name: "test" }] });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users WHERE ((id = $1) OR (name = $2));");
			expect(values).toEqual([1, "test"]);
		});

		it("should handle rawWhere and renumber placeholders", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["*"]);
			qh.where({ params: { status: "active" } }); // uses $1
			qh.rawWhere("AND age > $1", [20]); // should become $2
			const { query, values } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users WHERE (status = $1) AND age > $2;");
			expect(values).toEqual(["active", 20]);
		});

		it("should handle LEFT JOIN", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["*"]);
			qh.from("users");
			qh.leftJoin({ initialField: "id", targetField: "user_id", targetTableName: "profiles" });
			const { query } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users LEFT JOIN profiles ON profiles.user_id = users.id;");
		});

		it("should handle JOIN with an alias in FROM", () => {
			const qh = new QueryHandler({ dataSourcePrepared: "u", dataSourceRaw: "users" });

			qh.select(["*"]);
			qh.from("users as u");
			qh.innerJoin({ initialField: "id", targetField: "user_id", targetTableName: "profiles" });
			const { query } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users as u INNER JOIN profiles ON profiles.user_id = u.id;");
		});

		it("should handle ORDER BY", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["*"]);
			qh.orderBy([{ column: "name", sorting: "ASC" }, { column: "age", sorting: "DESC" }]);
			const { query } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users ORDER BY name ASC, age DESC;");
		});

		it("should handle GROUP BY", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["status"]);
			qh.groupBy(["status"]);
			const { query } = qh.compareQuery();

			expect(query).toBe("SELECT status FROM users GROUP BY status;");
		});

		it("should handle HAVING", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["status", "COUNT(id)"]);
			qh.groupBy(["status"]);
			qh.having({ params: { "COUNT(id)": { $gt: 1 } } });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("SELECT status, COUNT(id) FROM users GROUP BY status HAVING (COUNT(id) > $1);");
			expect(values).toEqual([1]);
		});

		it("should handle PAGINATION and value indexing", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["*"]);
			qh.where({ params: { status: "active" } });
			qh.pagination({ limit: 10, offset: 20 });
			const { query, values } = qh.compareQuery();

			expect(query).toBe("SELECT * FROM users WHERE (status = $1) LIMIT $2 OFFSET $3;");
			expect(values).toEqual(["active", 10, 20]);
		});

		it("should handle RETURNING", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.insert({ params: { name: "new" } });
			qh.returning(["id", "name"]);
			const { query } = qh.compareQuery();

			expect(query).toContain("RETURNING id, name;");
		});

		it("should handle WITH clause (CTE)", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.with({ name: "regional_sales", query: "SELECT region, SUM(amount) AS total_sales FROM orders GROUP BY region" });
			qh.select(["*"]);
			qh.from("regional_sales");
			const { query } = qh.compareQuery();

			expect(query).toBe("WITH regional_sales AS (SELECT region, SUM(amount) AS total_sales FROM orders GROUP BY region) SELECT * FROM regional_sales;");
		});
	});

	describe("Subqueries and Complex Logic", () => {
		it("should format as a subquery", () => {
			const qh = new QueryHandler(defaultOptions);

			qh.select(["id"]);
			qh.where({ params: { age: { $gt: 20 } } });
			qh.toSubquery("young_users");

			const { query, values } = qh.compareQuery();

			expect(query).toBe("(SELECT id FROM users WHERE (age > $1)) AS young_users");
			expect(values).toEqual([20]);
		});

		it("should construct a complex query", () => {
			const qh = new QueryHandler({ dataSourcePrepared: "p", dataSourceRaw: "posts" });

			qh.select(["p.id", "p.title", "u.name as author"]);
			qh.from("posts as p");
			qh.innerJoin({
				initialField: "author_id",
				initialTableName: "p",
				targetField: "id",
				targetTableName: "users",
				targetTableNameAs: "u",
			});
			qh.where({
				params: { "p.status": "published" },
				paramsOr: [
					{ "u.age": { $gte: 65 } },
					{ "u.age": { $lte: 18 } },
				],
			});
			qh.orderBy([{ column: "p.created_at", sorting: "DESC" }]);
			qh.pagination({ limit: 10, offset: 0 });

			const { query, values } = qh.compareQuery();

			const expectedQuery = [
				"SELECT p.id, p.title, u.name as author FROM posts as p",
				"INNER JOIN users AS u ON u.id = p.author_id",
				"WHERE (p.status = $1) AND ((u.age >= $2) OR (u.age <= $3))",
				"ORDER BY p.created_at DESC",
				"LIMIT $4 OFFSET $5;",
			].join(" ");

			expect(query).toBe(expectedQuery);
			expect(values).toEqual(["published", 65, 18, 10, 0]);
		});
	});
});
