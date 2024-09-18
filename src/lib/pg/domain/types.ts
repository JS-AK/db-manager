/* eslint-disable @typescript-eslint/no-explicit-any */

import * as SharedTypes from "../../../shared-types/index.js";

export type TArray2OrMore<T> = { 0: T; 1: T; } & Array<T>;
export type TCompareQueryResult = { query: string; values: unknown[]; };
export type TConditionalDomainFieldsType<First, Second> = First extends TDomainFields ? First : Partial<Second>;
export type TConditionalRawParamsType<First, Second> = First extends SharedTypes.TRawParams ? First : Partial<Second>;
export type TDomain<Model> = { model: Model; };
export type TDomainFields = { [key: string]: any; };

export type TSearchParams<T> =
	& TSearchParamsStrict<T>
	// & Partial<Record<JsonKeysToStringResult<Required<T>>, TDefault>>
	& { [key: string]: TDefault | undefined; };

export type TSearchParamsStrict<T> = {
	[key in keyof T]: (null extends T[key] ? (null | { $eq: null; }) | TSearchParamValue<NonNullable<T[key]>> : TSearchParamValue<NonNullable<T[key]>>)
};

type TSearchParamValue<T> = T extends object
	? TSearchParamObjectValue<T>
	: TSearchParamPrimitiveValue<T>;

type TSearchParamObjectValue<T> = T extends Date
	? BaseDate
	: T extends Buffer
		? BaseBuffer
		: T extends Array<unknown>
			? BaseArray<T>
			: BaseObject<T>;

type TSearchParamPrimitiveValue<T> = T extends string | number
	? BaseStringOrNumber<T>
	: BaseBoolean<ClearBoolean>;

type TDefault =
	| BaseDate
	| BaseBuffer
	| BaseStringOrNumber<ClearString>
	| BaseStringOrNumber<ClearNumber>
	| BaseBoolean<ClearBoolean>
	| BaseArray<any[]>
	| BaseObject<object>
	| null
	| { $eq: null; };

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

type BaseBuffer =
	| ClearBuffer
	| Base<ClearBuffer>
	| Array<Base<ClearBuffer>>;

type BaseDate =
	| ClearDate
	| Base<ClearDate>
	| Array<Base<ClearDate>>;

// https://www.postgresql.org/docs/current/ltree.html
type BaseLtree =
	| { ["$@>"]: string | string[]; }
	| { ["$<@"]: string | string[]; }
	| { ["$@"]: string | string[]; }
	| { ["$~"]: string | string[]; }
	| { ["$?"]: string | string[]; };

type BaseArray<T> =
	| T extends Date ? ClearDate : T
	| { ["$@>"]: NonNullable<T>; }
	| { ["$<@"]: NonNullable<T>; }
	| { ["$&&"]: NonNullable<T>; }
	| { $eq: T; }
	| { $ne: NonNullable<T> | null; };

// https://www.postgresql.org/docs/current/functions-json.html#FUNCTIONS-JSON-OP-TABLE
type BaseObject<T> =
	| { ["$?"]: string; }
	| { ["$@>"]: string | number | Date | string[] | number[] | Date[]; }
	| { $json: T; }
	| { $jsonb: T; }
	| { $eq: T; }
	| { $ne: NonNullable<T> | null; };

type BaseStringOrNumber<T> =
	| T
	| BaseLtree
	| Base<T>
	| Array<BaseLtree | Base<T>>;

type BaseBoolean<T> =
	| T
	| { $ne: NonNullable<T> | null; }
	| { $custom: { sign: string; value: string | number; }; };

/* type Join<K extends string, P extends string> = `${K}${P}`;

type JsonKeysToStringStart<T, P extends string = ""> = {
	[K in keyof T]: K extends string
		? T[K] extends object
			? Join<P, `'${K}'`> | JsonKeysToStringStart<T[K], Join<P, `'${K}'->`>>
			: Join<P, `'${K}'`>
		: never
}[keyof T];

type JsonKeysToStringResult<T> = {
	[K in keyof T]: K extends string
		? T[K] extends Date
			? never
			: T[K] extends Array<unknown>
				? never
				: T[K] extends object
					? K | `${K}->${JsonKeysToStringStart<T[K]>}`
					: never
		: never
}[keyof T]; */

type ClearBuffer = Omit<Buffer, Extract<keyof Buffer, string>>;
type ClearDate = Omit<Date, Extract<keyof Date, string>>;
type ClearString = Omit<string, Extract<keyof string, string>>;
type ClearNumber = Omit<number, Extract<keyof number, string>>;
type ClearBoolean = Omit<boolean, Extract<keyof boolean, string>>;
