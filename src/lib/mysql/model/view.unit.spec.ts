import {
	describe,
	expect,
	it,
} from "vitest";
import mysql from "mysql2/promise";

import * as Types from "./types.js";
import { BaseView } from "./view.js";

const mockClient = {} as mysql.PoolConnection;

const usersViewSchema = {
	coreFields: ["id", "name", "age", "published"],
	name: "users_view",
} satisfies Types.TView;

const invTypesViewSchema = {
	coreFields: ["typeID", "typeName", "published"],
	name: "invTypesView",
} satisfies Types.TView;

function createView(
	schema: Types.TView = usersViewSchema,
	options?: Types.TVOptions,
): BaseView {
	return new BaseView(schema, undefined, { client: mockClient, ...options });
}

describe("BaseView", () => {
	describe("constructor", () => {
		it("should throw when neither client nor dbCreds are provided", () => {
			expect(() => new BaseView(usersViewSchema)).toThrow("No client or dbCreds provided");
		});

		it("should expose schema metadata", () => {
			const view = createView();

			expect(view.name).toBe("users_view");
			expect(view.coreFields).toEqual(["id", "name", "age", "published"]);
		});
	});

	describe("compareQuery.getOneByParams", () => {
		it("should build SELECT with LIMIT 1", () => {
			const view = createView();
			const result = view.compareQuery.getOneByParams(
				{ $and: { published: true } },
				["id", "name"],
			);

			expect(result.query).toBe(
				"SELECT `id`, `name` FROM `users_view` WHERE (`published` = ?) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([true]);
		});

		it("should support quoted SQL identifiers from schema", () => {
			const view = createView(invTypesViewSchema);
			const result = view.compareQuery.getOneByParams(
				{ $and: { typeID: 34 } },
				["typeID", "typeName"],
			);

			expect(result.query).toBe(
				"SELECT `typeID`, `typeName` FROM `invTypesView` WHERE (`typeID` = ?) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([34]);
		});
	});

	describe("compareQuery.getArrByParams", () => {
		it("should build SELECT with pagination and order", () => {
			const view = createView();
			const result = view.compareQuery.getArrByParams(
				{ $and: { published: true } },
				["id", "name"],
				{ limit: 10, offset: 5 },
				[{ orderBy: "name", ordering: "ASC" }],
			);

			expect(result.query).toBe(
				"SELECT `id`, `name` FROM `users_view` WHERE (`published` = ?) ORDER BY `name` ASC LIMIT 10 OFFSET 5;",
			);
			expect(result.values).toEqual([true]);
		});

		it("should throw for invalid orderBy", () => {
			const view = createView();

			expect(() => view.compareQuery.getArrByParams(
				{ $and: {} },
				["*"],
				undefined,
				[{ orderBy: "unknown", ordering: "ASC" }],
			)).toThrow("Invalid orderBy: unknown");
		});
	});

	describe("compareQuery.getCountByParams", () => {
		it("should build COUNT query", () => {
			const view = createView();
			const result = view.compareQuery.getCountByParams({
				$and: { published: true },
			});

			expect(result.query).toBe("SELECT COUNT(*) AS count FROM `users_view` WHERE (`published` = ?);");
			expect(result.values).toEqual([true]);
		});
	});

	describe("compareQuery.streamArrByParams", () => {
		it("should build the same query shape as getArrByParams", () => {
			const view = createView();
			const result = view.compareQuery.streamArrByParams(
				{ $and: { published: true } },
				["id"],
				{ limit: 5, offset: 0 },
			);

			expect(result.query).toBe(
				"SELECT `id` FROM `users_view` WHERE (`published` = ?) LIMIT 5 OFFSET 0;",
			);
		});
	});
});
