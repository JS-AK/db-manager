import * as Types from "../types.js";

export const operatorMappings: Map<
	Types.TOperator,
	(element: Types.TField,
	) => string> = new Map([
		["$custom", (element: Types.TField) => ` ${element.key} ${element.sign} ?`],
		["$in", (element: Types.TField) => ` ${element.key} IN (?)`],
		["$like", (element: Types.TField) => ` ${element.key} LIKE ?`],
		["$nin", (element: Types.TField) => ` ${element.key} NOT IN (?)`],
		["$nlike", (element: Types.TField) => ` ${element.key} NOT LIKE ?`],
		["$withoutParameters", (element: Types.TField) => element.key],
	]);
