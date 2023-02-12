export type TArray2OrMore<T> = { 0: T; 1: T; } & Array<T>;
export type TDomain<Model> = { model: Model; };
export type TDomainFields = { [key: string]: any; };
export type TSearchParams<T> = {
	[key in keyof T]: T[key]
	| { $ne: NonNullable<T[key]> | null; }
	| { $gt: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
	| { $gte: NonNullable<T[key]>; $lt: NonNullable<T[key]>; }
	| { $gt: NonNullable<T[key]>; $lte: NonNullable<T[key]>; }
	| { $gt: NonNullable<T[key]>; }
	| { $gte: NonNullable<T[key]>; }
	| { $lt: NonNullable<T[key]>; }
	| { $lte: NonNullable<T[key]>; }
	| { $like: string; }
	| { $nlike: string; }
	| { $in: NonNullable<T[key]>[]; }
	| { $nin: NonNullable<T[key]>[]; }
};
