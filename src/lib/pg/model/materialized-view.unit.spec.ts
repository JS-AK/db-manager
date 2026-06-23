import {
	describe,
	expect,
	it,
	vi,
} from "vitest";
import pg from "pg";

import * as Types from "./types.js";
import { BaseMaterializedView } from "./materialized-view.js";

const mockClient = {} as pg.Client;

const usersMvSchema = {
	coreFields: ["id", "name", "age", "published"],
	name: "users_mv",
} satisfies Types.TMaterializedView;

const invTypesMvSchema = {
	coreFields: ["typeID", "typeName", "published"],
	name: "invTypesMv",
} satisfies Types.TMaterializedView;

function createMaterializedView(
	schema: Types.TMaterializedView = usersMvSchema,
	options?: Types.TMVOptions,
): BaseMaterializedView {
	return new BaseMaterializedView(schema, undefined, { client: mockClient, ...options });
}

describe("BaseMaterializedView", () => {
	describe("constructor", () => {
		it("should throw when neither client nor dbCreds are provided", () => {
			expect(() => new BaseMaterializedView(usersMvSchema)).toThrow("No client or dbCreds provided");
		});

		it("should expose schema metadata", () => {
			const mv = createMaterializedView();

			expect(mv.name).toBe("users_mv");
			expect(mv.coreFields).toEqual(["id", "name", "age", "published"]);
		});

		it("should copy coreFields array", () => {
			const coreFields = ["id", "name"];
			const mv = createMaterializedView({ ...usersMvSchema, coreFields });

			expect(mv.coreFields).toEqual(coreFields);
			expect(mv.coreFields).not.toBe(coreFields);
		});
	});

	describe("compareQuery.getOneByParams", () => {
		it("should build SELECT with LIMIT 1", () => {
			const mv = createMaterializedView();
			const result = mv.compareQuery.getOneByParams(
				{ $and: { published: true } },
				["id", "name"],
			);

			expect(result.query).toBe(
				"SELECT \"id\", \"name\" FROM \"users_mv\" WHERE (\"published\" = $1) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([true]);
		});

		it("should support quoted SQL identifiers from schema", () => {
			const mv = createMaterializedView(invTypesMvSchema);
			const result = mv.compareQuery.getOneByParams(
				{ $and: { typeID: 34 } },
				["typeID", "typeName"],
			);

			expect(result.query).toBe(
				"SELECT \"typeID\", \"typeName\" FROM \"invTypesMv\" WHERE (\"typeID\" = $1) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([34]);
		});
	});

	describe("compareQuery.getArrByParams", () => {
		it("should build SELECT with pagination and order", () => {
			const mv = createMaterializedView();
			const result = mv.compareQuery.getArrByParams(
				{ $and: { published: true } },
				["id", "name"],
				{ limit: 10, offset: 5 },
				[{ orderBy: "name", ordering: "ASC" }],
			);

			expect(result.query).toBe(
				"SELECT \"id\", \"name\" FROM \"users_mv\" WHERE (\"published\" = $1) ORDER BY \"name\" ASC LIMIT 10 OFFSET 5;",
			);
			expect(result.values).toEqual([true]);
		});

		it("should allow additionalSortingFields for orderBy", () => {
			const mv = createMaterializedView({
				...usersMvSchema,
				additionalSortingFields: ["computed_rank"],
			});
			const result = mv.compareQuery.getArrByParams(
				{ $and: {} },
				["id"],
				undefined,
				[{ orderBy: "computed_rank", ordering: "DESC" }],
			);

			expect(result.query).toBe(
				"SELECT \"id\" FROM \"users_mv\" WHERE (1=1) ORDER BY computed_rank DESC;",
			);
		});

		it("should throw for invalid orderBy", () => {
			const mv = createMaterializedView();

			expect(() => mv.compareQuery.getArrByParams(
				{ $and: {} },
				["*"],
				undefined,
				[{ orderBy: "unknown", ordering: "ASC" }],
			)).toThrow("Invalid orderBy: unknown");
		});

		it("should throw for invalid ordering", () => {
			const mv = createMaterializedView();

			expect(() => mv.compareQuery.getArrByParams(
				{ $and: {} },
				["*"],
				undefined,
				[{ orderBy: "name", ordering: "INVALID" as "ASC" }],
			)).toThrow("Invalid ordering");
		});
	});

	describe("compareQuery.getCountByParams", () => {
		it("should build COUNT query", () => {
			const mv = createMaterializedView();
			const result = mv.compareQuery.getCountByParams({
				$and: { published: true },
			});

			expect(result.query).toBe("SELECT COUNT(*) AS count FROM \"users_mv\" WHERE (\"published\" = $1);");
			expect(result.values).toEqual([true]);
		});
	});

	describe("compareQuery.streamArrByParams", () => {
		it("should build the same query shape as getArrByParams", () => {
			const mv = createMaterializedView();
			const result = mv.compareQuery.streamArrByParams(
				{ $and: { published: true } },
				["id"],
				{ limit: 5, offset: 0 },
			);

			expect(result.query).toBe(
				"SELECT \"id\" FROM \"users_mv\" WHERE (\"published\" = $1) LIMIT 5 OFFSET 0;",
			);
		});
	});

	describe("refresh", () => {
		it("should execute REFRESH MATERIALIZED VIEW", async () => {
			const query = vi.fn().mockResolvedValue({ rows: [] });
			const client = { query } as unknown as pg.Client;
			const mv = createMaterializedView(usersMvSchema, { client });

			await mv.refresh();

			expect(query).toHaveBeenCalledWith(
				"REFRESH MATERIALIZED VIEW \"users_mv\"",
				undefined,
			);
		});

		it("should execute REFRESH MATERIALIZED VIEW CONCURRENTLY", async () => {
			const query = vi.fn().mockResolvedValue({ rows: [] });
			const client = { query } as unknown as pg.Client;
			const mv = createMaterializedView(usersMvSchema, { client });

			await mv.refresh(true);

			expect(query).toHaveBeenCalledWith(
				"REFRESH MATERIALIZED VIEW CONCURRENTLY \"users_mv\"",
				undefined,
			);
		});
	});
});
