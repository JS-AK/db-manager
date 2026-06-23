import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import mysql from "mysql2/promise";

import * as Types from "./types.js";
import { BaseTable } from "./table.js";

const mockClient = {} as mysql.PoolConnection;

const usersSchema = {
	createField: null,
	primaryKey: "id",
	tableFields: ["id", "name", "age", "published"],
	tableName: "users",
	updateField: { title: "updated_at", type: "timestamp" as const },
} satisfies Types.TTable;

const invTypesSchema = {
	createField: null,
	primaryKey: "typeID",
	tableFields: ["typeID", "typeName", "published"],
	tableName: "invTypes",
	updateField: null,
} satisfies Types.TTable;

function createTable(
	schema: Types.TTable = usersSchema,
	options?: Types.TDBOptions,
): BaseTable {
	return new BaseTable(schema, undefined, { client: mockClient, ...options });
}

describe("BaseTable", () => {
	describe("constructor", () => {
		it("should throw when neither client nor dbCreds are provided", () => {
			expect(() => new BaseTable(usersSchema)).toThrow("No client or dbCreds provided");
		});

		it("should expose schema metadata", () => {
			const table = createTable();

			expect(table.tableName).toBe("users");
			expect(table.primaryKey).toBe("id");
			expect(table.tableFields).toEqual(["id", "name", "age", "published"]);
			expect(table.updateField).toEqual({ title: "updated_at", type: "timestamp" });
		});
	});

	describe("compareQuery.createOne", () => {
		it("should build INSERT query and values", () => {
			const table = createTable();
			const result = table.compareQuery.createOne({ age: 30, name: "John" });

			expect(result.query).toBe("INSERT INTO `users` (`age`,`name`) VALUES (?,?) ;");
			expect(result.values).toEqual([30, "John"]);
		});

		it("should throw when no fields are provided", () => {
			const table = createTable();

			expect(() => table.compareQuery.createOne({})).toThrow("No one save field arrived");
		});

		it("should apply onConflict from insertOptions", () => {
			const table = createTable(usersSchema, {
				insertOptions: { onConflict: "ON DUPLICATE KEY UPDATE id=id" },
			});
			const result = table.compareQuery.createOne({ name: "John" });

			expect(result.query).toBe(
				"INSERT INTO `users` (`name`) VALUES (?) ON DUPLICATE KEY UPDATE id=id;",
			);
		});
	});

	describe("compareQuery.createMany", () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should build INSERT for multiple rows", () => {
			const table = createTable();
			const result = table.compareQuery.createMany([
				{ age: 30, name: "John" },
				{ age: 25, name: "Jane" },
			]);

			expect(result.query).toBe(
				"INSERT INTO `users` (`age`,`name`) VALUES (?,?),(?,?) ;",
			);
			expect(result.values).toEqual([30, "John", 25, "Jane"]);
		});

		it("should throw for empty recordParams", () => {
			const table = createTable();

			expect(() => table.compareQuery.createMany([])).toThrow("Invalid recordParams");
		});

		it("should append createField when missing in params", () => {
			const table = createTable({
				...usersSchema,
				createField: { title: "created_at", type: "timestamp" },
				tableFields: [...usersSchema.tableFields, "created_at"],
			});
			const result = table.compareQuery.createMany([{ name: "John" }]);

			expect(result.query).toBe(
				"INSERT INTO `users` (`name`,`created_at`) VALUES (?,?) ;",
			);
			expect(result.values).toEqual(["John", "2024-01-01T00:00:00.000Z"]);
		});
	});

	describe("compareQuery.deleteAll", () => {
		it("should build DELETE query", () => {
			const table = createTable();

			expect(table.compareQuery.deleteAll()).toEqual({
				query: "DELETE FROM `users`;",
			});
		});
	});

	describe("compareQuery.deleteByParams", () => {
		it("should build DELETE with search conditions", () => {
			const table = createTable();
			const result = table.compareQuery.deleteByParams({
				$and: { age: { $gt: 18 }, published: true },
			});

			expect(result.query).toBe("DELETE FROM `users` WHERE ((`age` > ?) AND (`published` = ?));");
			expect(result.values).toEqual([18, true]);
		});
	});

	describe("compareQuery.deleteOneByPk", () => {
		it("should build DELETE by primary key", () => {
			const table = createTable();
			const result = table.compareQuery.deleteOneByPk(42);

			expect(result.query).toBe("DELETE FROM `users` WHERE `id` = ?;");
			expect(result.values).toEqual([42]);
		});

		it("should throw when primary key is not configured", () => {
			const table = createTable({ ...usersSchema, primaryKey: null });

			expect(() => table.compareQuery.deleteOneByPk(1)).toThrow("Primary key not specified");
		});
	});

	describe("compareQuery.getOneByParams", () => {
		it("should build SELECT with LIMIT 1", () => {
			const table = createTable();
			const result = table.compareQuery.getOneByParams(
				{ $and: { published: true } },
				["id", "name"],
			);

			expect(result.query).toBe(
				"SELECT `id`, `name` FROM `users` WHERE (`published` = ?) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([true]);
		});

		it("should support quoted SQL identifiers from schema", () => {
			const table = createTable(invTypesSchema);
			const result = table.compareQuery.getOneByParams(
				{ $and: { typeID: 34 } },
				["typeID", "typeName"],
			);

			expect(result.query).toBe(
				"SELECT `typeID`, `typeName` FROM `invTypes` WHERE (`typeID` = ?) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([34]);
		});
	});

	describe("compareQuery.getArrByParams", () => {
		it("should build SELECT with pagination and order", () => {
			const table = createTable();
			const result = table.compareQuery.getArrByParams(
				{ $and: { published: true } },
				["id", "name"],
				{ limit: 10, offset: 5 },
				[{ orderBy: "name", ordering: "ASC" }],
			);

			expect(result.query).toBe(
				"SELECT `id`, `name` FROM `users` WHERE (`published` = ?) ORDER BY `name` ASC LIMIT 10 OFFSET 5;",
			);
			expect(result.values).toEqual([true]);
		});

		it("should throw for invalid orderBy", () => {
			const table = createTable();

			expect(() => table.compareQuery.getArrByParams(
				{ $and: {} },
				["*"],
				undefined,
				[{ orderBy: "unknown", ordering: "ASC" }],
			)).toThrow("Invalid orderBy: unknown");
		});
	});

	describe("compareQuery.getCountByParams", () => {
		it("should build COUNT query", () => {
			const table = createTable();
			const result = table.compareQuery.getCountByParams({
				$and: { published: true },
			});

			expect(result.query).toBe("SELECT COUNT(*) AS count FROM `users` WHERE (`published` = ?);");
			expect(result.values).toEqual([true]);
		});
	});

	describe("compareQuery.getOneByPk", () => {
		it("should build SELECT by primary key", () => {
			const table = createTable();
			const result = table.compareQuery.getOneByPk(7);

			expect(result.query).toBe("SELECT * FROM `users` WHERE `id` = ? LIMIT 1;");
			expect(result.values).toEqual([7]);
		});
	});

	describe("compareQuery.getCountByPks", () => {
		it("should build COUNT for scalar primary keys", () => {
			const table = createTable();
			const result = table.compareQuery.getCountByPks([1, 2, 3]);

			expect(result.query).toBe("SELECT COUNT(*) AS count FROM `users` WHERE `id` IN (?);");
			expect(result.values).toEqual([[1, 2, 3]]);
		});
	});

	describe("compareQuery.updateByParams", () => {
		it("should build UPDATE with WHERE and SET clauses", () => {
			const table = createTable();
			const result = table.compareQuery.updateByParams(
				{ $and: { id: 1 } },
				{ age: 31, name: "John" },
			);

			expect(result.query).toBe(
				"UPDATE `users` SET `age` = ?,`name` = ?, `updated_at` = UTC_TIMESTAMP() WHERE (`id` = ?);",
			);
			expect(result.values).toEqual([31, "John", 1]);
		});
	});

	describe("compareQuery.updateOneByPk", () => {
		it("should build UPDATE by primary key", () => {
			const table = createTable();
			const result = table.compareQuery.updateOneByPk(42, { name: "Jane" });

			expect(result.query).toBe(
				"UPDATE `users` SET `name` = ?, `updated_at` = UTC_TIMESTAMP() WHERE `id` = ?;",
			);
			expect(result.values).toEqual(["Jane", 42]);
		});
	});
});
