/* eslint-disable @typescript-eslint/no-explicit-any */

import * as SharedTypes from "../../../shared-types/index.js";
import * as Types from "./types.js";
import { BaseModel } from "../model/index.js";

export class BaseDomain<
	Model extends BaseModel,
	CreateFields extends SharedTypes.TRawParams,
	SearchFields extends Types.TDomainFields,
	TableFields extends SharedTypes.TRawParams,
	UpdateFields extends SharedTypes.TRawParams,
> {
	model;

	constructor(data: Types.TDomain<Model>) {
		if (!(data.model instanceof BaseModel)) {
			throw new Error("You need pass extended of PG.");
		}

		this.model = data.model;
	}

	async createOne(createFields: CreateFields): Promise<number> {
		const res = await this.model.save(createFields);

		if (!res) throw new Error(`Save to ${this.model.tableName} table error`);

		return res;
	}

	async deleteOneByPk(pk: string): Promise<void> {
		await this.model.delete(pk);
	}

	async deleteAll(): Promise<void> {
		return this.model.deleteAll();
	}

	async getArrByParams({ params, selected = ["*"], pagination, orderBy, ordering }: {
		params: SearchFields;
		selected?: string[];
		pagination?: SharedTypes.TPagination;
		orderBy?: string;
		ordering?: SharedTypes.TOrdering;
	}): Promise<any[]> {
		return this.model.getArrByParams(params, selected, pagination, orderBy, ordering);
	}

	async getCountByParams({ params }: { params: SearchFields; }): Promise<number> {
		return this.model.getCountByParams(params);
	}

	async getGuaranteedOneByParams({ params, selected = ["*"] }: {
		params: SearchFields;
		selected?: string[];
	}): Promise<TableFields> {
		return this.model.getOneByParams(params, selected);
	}

	async getOneByParams({ params, selected = ["*"] }: {
		params: SearchFields;
		selected?: string[];
	}): Promise<{ message?: string; one?: any; }> {
		const one = await this.model.getOneByParams(params, selected);

		if (!one) return { message: "Not found" };

		return { one };
	}

	async getOneByPk(pk: string | string[]): Promise<{ message?: string; one?: any; }> {
		const one = await this.model.getOneByPk(pk);

		if (!one) return { message: "Not found" };

		return { one };
	}

	async updateOneByPk(pk: string, params: UpdateFields): Promise<void> {
		return await this.model.update(pk, params);
	}
}
