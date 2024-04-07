/* eslint-disable @typescript-eslint/no-explicit-any */

export type TArray2OrMore<T> = { 0: T; 1: T; } & Array<T>;
export type TDomain<Model> = { model: Model; };
export type TDomainFields = { [key: string]: any; };

export type TSearchParams<T> = {
	[key in keyof T]: T[key]
	| { $custom: { sign: string; value: string | number; }; }
	| { $eq: T[key]; }
	| { $ne: NonNullable<T[key]> | null; }
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
};
