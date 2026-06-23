import {
	describe,
	expect,
	it,
	vi,
} from "vitest";
import mysql from "mysql2/promise";

import * as Types from "./types.js";
import { BaseMaterializedView } from "./materialized-view.js";

const mockClient = {} as mysql.PoolConnection;

const usersMvSchema = {
	coreFields: ["id", "name", "age", "published"],
	name: "users_mv",
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
	});

	describe("compareQuery.getOneByParams", () => {
		it("should build SELECT with LIMIT 1", () => {
			const mv = createMaterializedView();
			const result = mv.compareQuery.getOneByParams(
				{ $and: { published: true } },
				["id", "name"],
			);

			expect(result.query).toBe(
				"SELECT `id`, `name` FROM `users_mv` WHERE (`published` = ?) LIMIT 1 OFFSET 0;",
			);
			expect(result.values).toEqual([true]);
		});
	});

	describe("compareQuery.getCountByParams", () => {
		it("should build COUNT query", () => {
			const mv = createMaterializedView();
			const result = mv.compareQuery.getCountByParams({
				$and: { published: true },
			});

			expect(result.query).toBe("SELECT COUNT(*) AS count FROM `users_mv` WHERE (`published` = ?);");
			expect(result.values).toEqual([true]);
		});
	});

	describe("refresh", () => {
		it("should execute REFRESH MATERIALIZED VIEW", async () => {
			const query = vi.fn().mockResolvedValue([[], []]);
			const client = { query } as unknown as mysql.PoolConnection;
			const mv = createMaterializedView(usersMvSchema, { client });

			await mv.refresh();

			expect(query).toHaveBeenCalledWith(
				"REFRESH MATERIALIZED VIEW `users_mv`",
				undefined,
			);
		});

		it("should execute REFRESH MATERIALIZED VIEW CONCURRENTLY", async () => {
			const query = vi.fn().mockResolvedValue([[], []]);
			const client = { query } as unknown as mysql.PoolConnection;
			const mv = createMaterializedView(usersMvSchema, { client });

			await mv.refresh(true);

			expect(query).toHaveBeenCalledWith(
				"REFRESH MATERIALIZED VIEW CONCURRENTLY `users_mv`",
				undefined,
			);
		});
	});
});
