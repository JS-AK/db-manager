import * as Types from "../types.js";

/**
 * A mapping of search operators to their corresponding processing functions.
 *
 * This `Map` associates an operator key (e.g., `$eq`, `$gt`) with a function that processes the search parameter,
 * modifies the `queryArray`, and populates the `values` array with the appropriate values for the SQL query.
 *
 * @type {Map<
 *   keyof Types.TSearchParams,
 *   (key: string, value: Types.TSearchParams[keyof Types.TSearchParams], queryArray: Types.TField[], values: unknown[]) => void
 * >}
 *
 * @property {function} $custom - Processes a custom operator, pushing the key and value to the `queryArray` and `values` respectively.
 * @property {function} $eq - Processes an equality check (`=`), handling both regular and `NULL` values.
 * @property {function} $gt - Processes a greater-than comparison (`>`).
 * @property {function} $gte - Processes a greater-than-or-equal comparison (`>=`).
 * @property {function} $in - Processes an inclusion check (`IN`), pushing the array of values.
 * @property {function} $@> - Processes a containment check (`@>`), typically for arrays, ranges, or JSON.
 * @property {function} $<@ - Processes an is-contained-by check (`<@`), typically for arrays or ranges.
 * @property {function} $&& - Processes an overlap check (`&&`), typically for arrays or ranges.
 * @property {function} $@ - Processes a distance operator (`@`), typically for geometric types.
 * @property {function} $~ - Processes a regular expression match (`~`).
 * @property {function} $? - Processes an existence check (`?`), typically for JSON keys.
 * @property {function} $json - Processes a JSON equality check.
 * @property {function} $jsonb - Processes a JSONB equality check.
 * @property {function} $like - Processes a pattern match (`LIKE`).
 * @property {function} $ilike - Processes a case-insensitive pattern match (`ILIKE`).
 * @property {function} $lt - Processes a less-than comparison (`<`).
 * @property {function} $lte - Processes a less-than-or-equal comparison (`<=`).
 * @property {function} $ne - Processes a not-equal comparison (`<>`), handling both regular and `NULL` values.
 * @property {function} $nin - Processes a not-inclusion check (`NOT IN`).
 * @property {function} $between - Processes a range check (`BETWEEN`).
 * @property {function} $nbetween - Processes a not-in-range check (`NOT BETWEEN`).
 * @property {function} $nlike - Processes a not-like pattern match (`NOT LIKE`).
 * @property {function} $nilike - Processes a not-ilike pattern match (`NOT ILIKE`).
 */
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
			const v = value as { $eq: number | string | boolean | object; };

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
