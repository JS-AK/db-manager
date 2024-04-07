/* eslint-disable @typescript-eslint/no-explicit-any */

export type TArray2OrMore<T> = { 0: T; 1: T; } & Array<T>;
export type TDomain<Model> = { model: Model; };
export type TDomainFields = { [key: string]: any; };

export type TSearchParams<T> = {
	[key in keyof T]: NonNullable<T[key]> extends object
		? NonNullable<T[key]> extends Date
			? BaseDate<T[key]>
			: NonNullable<T[key]> extends Array<unknown>
				? BaseArray<T[key]>
				: BaseObject<T[key]>
		: NonNullable<T[key]> extends string | number
			? BaseStringOrNumber<T[key]>
			: BaseBoolean<T[key]>
};

type Base<T> =
	| { $custom: { sign: string; value: string | number; }; }
	| { $eq: T; }
	| { $ne: NonNullable<T> | null; }
	| { $between: [NonNullable<T>, NonNullable<T>]; }
	| { $nbetween: [NonNullable<T>, NonNullable<T>]; }
	| { $gt: NonNullable<T>; }
	| { $gte: NonNullable<T>; }
	| { $lt: NonNullable<T>; }
	| { $lte: NonNullable<T>; }
	| { $like: string; }
	| { $ilike: string; }
	| { $nlike: string; }
	| { $nilike: string; }
	| { $in: NonNullable<T>[]; }
	| { $nin: NonNullable<T>[]; };

type BaseDate<T> = T | Base<T> | Array<Base<T>>;

type BaseLtree = // https://www.postgresql.org/docs/current/ltree.html
	| { ["$@>"]: string | string[]; }
	| { ["$<@"]: string | string[]; }
	| { ["$@"]: string | string[]; }
	| { ["$~"]: string | string[]; }
	| { ["$?"]: string | string[]; };

type BaseArray<T> =
	| T
	| { ["$@>"]: NonNullable<T>; }
	| { ["$<@"]: NonNullable<T>; }
	| { ["$&&"]: NonNullable<T>; }
	| { ["$&&"]: NonNullable<T>; }
	| { $eq: T; }
	| { $ne: NonNullable<T> | null; };

type BaseObject<T> =
	| { $json: T; }
	| { $jsonb: T; }
	| { $eq: T; }
	| { $ne: NonNullable<T> | null; };

type BaseStringOrNumber<T> =
	| T
	| BaseLtree
	| Base<T>
	| Array<
		| BaseLtree
		| Base<T>
	>;

type BaseBoolean<T> =
	| T
	| { $ne: NonNullable<T> | null; }
	| { $custom: { sign: string; value: string | number; }; };
