import * as Types from "../types.js";

export const processMappings: Map<
	keyof Types.TSearchParams,
	(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[],) => void
> = new Map([
	[
		"$custom",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $custom: { sign: string; value: string | number; }; };

			queryArray.push({ key, operator: "$custom", sign: v.$custom.sign });
			values.push(v.$custom.value);
		},
	],
	[
		"$eq",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $eq: number | string | boolean | null; };

			if (v.$eq === null) {
				queryArray.push({ key: `${key} IS NULL`, operator: "$withoutParameters" });
			} else {
				queryArray.push({ key, operator: "=" });
				values.push(v.$eq);
			}
		},
	],
	[
		"$gt",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $gt: number | string | boolean; };

			queryArray.push({ key, operator: ">" });
			values.push(v.$gt);
		},
	],
	[
		"$gte",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $gte: number | string | boolean; };

			queryArray.push({ key, operator: ">=" });
			values.push(v.$gte);
		},
	],
	[
		"$in",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $in: string[] | number[] | boolean[]; };

			queryArray.push({ key, operator: "$in" });
			values.push(v.$in);
		},
	],
	// @> is the "contains" operator.
	// arrays:          http://www.postgresql.org/docs/current/static/functions-array.html
	// range types:     http://www.postgresql.org/docs/current/static/functions-range.html
	// geometric types: http://www.postgresql.org/docs/current/static/functions-geometry.html
	// JSON(and JSONB): http://www.postgresql.org/docs/current/static/functions-json.html
	[
		"$@>",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { "$@>": object; };

			queryArray.push({ key, operator: "@>" });
			values.push(v["$@>"]);
		},
	],
	[
		"$<@",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { "$<@": object; };

			queryArray.push({ key, operator: "<@" });
			values.push(v["$<@"]);
		},
	],
	[
		"$&&",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { "$&&": object; };

			queryArray.push({ key, operator: "&&" });
			values.push(v["$&&"]);
		},
	],
	[
		"$@",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { "$@": string; };

			queryArray.push({ key, operator: "@" });
			values.push(v["$@"]);
		},
	],
	[
		"$~",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { "$~": string; };

			queryArray.push({ key, operator: "~" });
			values.push(v["$~"]);
		},
	],
	[
		"$?",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { "$?": string; };

			queryArray.push({ key, operator: "?" });
			values.push(v["$?"]);
		},
	],
	[
		"$json",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $json: object; };

			queryArray.push({ key, operator: "=" });
			values.push(v.$json);
		},
	],
	[
		"$jsonb",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $jsonb: object; };

			queryArray.push({ key, operator: "=" });
			values.push(v.$jsonb);
		},
	],
	[
		"$like",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $like: string; };

			queryArray.push({ key, operator: "$like" });
			values.push(v.$like);
		},
	],
	[
		"$ilike",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $ilike: string; };

			queryArray.push({ key, operator: "$ilike" });
			values.push(v.$ilike);
		},
	],
	[
		"$lt",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $lt: number | string | boolean; };

			queryArray.push({ key, operator: "<" });
			values.push(v.$lt);
		},
	],
	[
		"$lte",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $lte: number | string | boolean; };

			queryArray.push({ key, operator: "<=" });
			values.push(v.$lte);
		},
	],
	[
		"$ne",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $ne: number | string | boolean | null; };

			if (v.$ne === null) {
				queryArray.push({ key: `${key} IS NOT NULL`, operator: "$withoutParameters" });
			} else {
				queryArray.push({ key, operator: "<>" });
				values.push(v.$ne);
			}
		},
	],
	[
		"$nin",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $nin: string[] | number[] | boolean[]; };

			queryArray.push({ key, operator: "$nin" });
			values.push(v.$nin);
		},
	],
	[
		"$between",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $between: string[] | number[]; };

			queryArray.push({ key, operator: "$between" });
			values.push(v.$between[0]);
			values.push(v.$between[1]);
		},
	],
	[
		"$nbetween",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $nbetween: string[] | number[]; };

			queryArray.push({ key, operator: "$nbetween" });
			values.push(v.$nbetween[0]);
			values.push(v.$nbetween[1]);
		},
	],
	[
		"$nlike",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $nlike: string; };

			queryArray.push({ key, operator: "$nlike" });
			values.push(v.$nlike);
		}],
	[
		"$nilike",
		(key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => {
			const v = value as { $nilike: string; };

			queryArray.push({ key, operator: "$nilike" });
			values.push(v.$nilike);
		}],
]);
