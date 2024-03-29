/* eslint-disable @typescript-eslint/no-explicit-any */

export type TArray2OrMore<T> = { 0: T; 1: T; } & Array<T>;
export type TDomain<Model> = { model: Model; };
export type TDomainFields = { [key: string]: any; };
export type TSearchParams<T> = {
	[key in keyof T]: NonNullable<T[key]> extends object
		? NonNullable<T[key]> extends Date
			? T[key]
				| { $ne: NonNullable<T[key]> | null; }
				| { $between: [NonNullable<T[key]>, NonNullable<T[key]>]; }
				| { $nbetween: [NonNullable<T[key]>, NonNullable<T[key]>]; }
				| { $gt: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
				| { $gte: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
				| { $gt: NonNullable<T[key]>; $lte: NonNullable<T[key]>; }
				| { $gt: NonNullable<T[key]>; }
				| { $gte: NonNullable<T[key]>; }
				| { $lt: NonNullable<T[key]>; }
				| { $lte: NonNullable<T[key]>; }
				| { $like: string; }
				| { $ilike: string; }
				| { $nlike: string; }
				| { $nilike: string; }
				| { $in: NonNullable<T[key]>[]; }
				| { $nin: NonNullable<T[key]>[]; }
				| { $custom: { sign: string; value: string | number; }; }
				| Array<
					| { $ne: NonNullable<T[key]> | null; } | { $between: [NonNullable<T[key]>, NonNullable<T[key]>]; }
					| { $nbetween: [NonNullable<T[key]>, NonNullable<T[key]>]; }
					| { $gt: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
					| { $gte: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
					| { $gt: NonNullable<T[key]>; $lte: NonNullable<T[key]>; }
					| { $gt: NonNullable<T[key]>; }
					| { $gte: NonNullable<T[key]>; }
					| { $lt: NonNullable<T[key]>; }
					| { $lte: NonNullable<T[key]>; }
					| { $like: string; }
					| { $ilike: string; }
					| { $nlike: string; }
					| { $nilike: string; }
					| { $in: NonNullable<T[key]>[]; }
					| { $nin: NonNullable<T[key]>[]; }
					| { $custom: { sign: string; value: string | number; }; }
				>
			: NonNullable<T[key]> extends Array<unknown>
				? | { ["$@>"]: NonNullable<T[key]>; }
					| { ["$<@"]: NonNullable<T[key]>; }
					| { ["$&&"]: NonNullable<T[key]>; }
				: | { $json: NonNullable<T[key]>; }
					| { $jsonb: NonNullable<T[key]>; }
		: NonNullable<T[key]> extends string | number
			? T[key]
				| { ["$@>"]: NonNullable<T[key]>; }
				| { ["$<@"]: NonNullable<T[key]>; }
				| { ["$~"]: string; }
				| { ["$@"]: string; }
				| { ["$?"]: string; }
				| { $ne: NonNullable<T[key]> | null; }
				| { $between: [NonNullable<T[key]>, NonNullable<T[key]>]; }
				| { $nbetween: [NonNullable<T[key]>, NonNullable<T[key]>]; }
				| { $gt: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
				| { $gte: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
				| { $gt: NonNullable<T[key]>; $lte: NonNullable<T[key]>; }
				| { $gt: NonNullable<T[key]>; }
				| { $gte: NonNullable<T[key]>; }
				| { $lt: NonNullable<T[key]>; }
				| { $lte: NonNullable<T[key]>; }
				| { $like: string; }
				| { $ilike: string; }
				| { $nlike: string; }
				| { $nilike: string; }
				| { $in: NonNullable<T[key]>[]; }
				| { $nin: NonNullable<T[key]>[]; }
				| { $custom: { sign: string; value: string | number; }; }
				| Array<
					| { ["$@>"]: NonNullable<T[key]>; }
					| { ["$<@"]: NonNullable<T[key]>; }
					| { ["$~"]: string; }
					| { ["$@"]: string; }
					| { ["$?"]: string; }
					| { $ne: NonNullable<T[key]> | null; }
					| { $between: [NonNullable<T[key]>, NonNullable<T[key]>]; }
					| { $nbetween: [NonNullable<T[key]>, NonNullable<T[key]>]; }
					| { $gt: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
					| { $gte: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
					| { $gt: NonNullable<T[key]>; $lte: NonNullable<T[key]>; }
					| { $gt: NonNullable<T[key]>; }
					| { $gte: NonNullable<T[key]>; }
					| { $lt: NonNullable<T[key]>; }
					| { $lte: NonNullable<T[key]>; }
					| { $like: string; }
					| { $ilike: string; }
					| { $nlike: string; }
					| { $nilike: string; }
					| { $in: NonNullable<T[key]>[]; }
					| { $nin: NonNullable<T[key]>[]; }
					| { $custom: { sign: string; value: string | number; }; }
				>
			: T[key]
				| { $ne: NonNullable<T[key]> | null; }
				| { $custom: { sign: string; value: string | number; }; }
};
