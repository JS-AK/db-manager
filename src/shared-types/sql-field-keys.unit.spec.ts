import {
	describe,
	expectTypeOf,
	it,
} from "vitest";

import type {
	PickRowFields,
	ResolveRowFields,
	RowFieldsFromCore,
	UnquoteSqlKey,
} from "./sql-field-keys.js";

type EveCoreFields = {
	"\"typeID\"": number;
	"\"groupName\"": string | null;
	description: string | null;
	published: boolean | null;
};

describe("sql field key types", () => {
	it("should unquote SQL identifiers", () => {
		expectTypeOf<UnquoteSqlKey<"\"typeID\"">>().toEqualTypeOf<"typeID">();
		expectTypeOf<UnquoteSqlKey<"description">>().toEqualTypeOf<"description">();
	});

	it("should map CoreFields to row fields", () => {
		expectTypeOf<RowFieldsFromCore<EveCoreFields>>().toEqualTypeOf<{
			typeID: number;
			groupName: string | null;
			description: string | null;
			published: boolean | null;
		}>();
	});

	it("should pick row fields by SQL selected keys", () => {
		expectTypeOf<PickRowFields<EveCoreFields, "\"typeID\"">>().toEqualTypeOf<{
			typeID: number;
		}>();
	});

	it("should resolve row fields from generic", () => {
		type Generic = { CoreFields: EveCoreFields; };

		expectTypeOf<ResolveRowFields<Generic>>().toEqualTypeOf<RowFieldsFromCore<EveCoreFields>>();
	});

	it("should prefer explicit RowFields override", () => {
		type Generic = {
			CoreFields: EveCoreFields;
			RowFields: { custom: string; };
		};

		expectTypeOf<ResolveRowFields<Generic>>().toEqualTypeOf<{ custom: string; }>();
	});
});
