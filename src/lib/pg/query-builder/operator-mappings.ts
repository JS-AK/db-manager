import * as Types from "../model/types.js";

export const operatorMappings: Map<
	Types.TOperator,
	(el: Types.TField, orderNumber: number) => [string, number]
> = new Map([
	[
		"$custom",
		(el: Types.TField, orderNumber: number) => [`${el.key} ${el.sign} $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$between",
		(el: Types.TField, orderNumber: number) => [`${el.key} BETWEEN $${orderNumber + 1} AND $${orderNumber + 2}`, orderNumber + 2],
	],
	[
		"$in",
		(el: Types.TField, orderNumber: number) => [`${el.key} = ANY ($${orderNumber + 1})`, orderNumber + 1],
	],
	[
		"$like",
		(el: Types.TField, orderNumber: number) => [`${el.key} LIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$ilike",
		(el: Types.TField, orderNumber: number) => [`${el.key} ILIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$nin",
		(el: Types.TField, orderNumber: number) => [`NOT (${el.key} = ANY ($${orderNumber + 1}))`, orderNumber + 1],
	],
	[
		"$nbetween",
		(el: Types.TField, orderNumber: number) => [`${el.key} NOT BETWEEN $${orderNumber + 1} AND $${orderNumber + 2}`, orderNumber + 2],
	],
	[
		"$nlike",
		(el: Types.TField, orderNumber: number) => [`${el.key} NOT LIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$nilike",
		(el: Types.TField, orderNumber: number) => [`${el.key} NOT ILIKE $${orderNumber + 1}`, orderNumber + 1],
	],
	[
		"$withoutParameters",
		(el: Types.TField, orderNumber: number) => [el.key, orderNumber],
	],
]);
