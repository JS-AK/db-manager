import * as SharedTypes from "../../../shared-types/index.js";

export default {
	delete(
		tableName: string,
		primaryKeyField: SharedTypes.TPrimaryKeyField,
	) {
		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = ?`);

			return `
				DELETE
				FROM ${tableName}
				WHERE ${query.join(" AND ")}
			`;
		}

		return `
			DELETE
			FROM ${tableName}
			WHERE ${primaryKeyField} = ?
		`;
	},

	deleteAll(tableName: string) {
		return `
			DELETE
			FROM ${tableName}
		`;
	},

	getByParams(
		tableName: string,
		fields: string[],
		nullFields: string[],
		selected = ["*"],
		pagination?: SharedTypes.TPagination,
		orderBy?: string,
		ordering = "ASC",
	) {
		let searchFields;

		if (fields.length) searchFields = fields.map((e: string) => `${e} = ?`).join(" AND ");
		else searchFields = "1=1";
		if (nullFields.length) {
			if (searchFields) searchFields += ` AND ${nullFields.join(" AND ")}`;
			else searchFields = nullFields.join(",");
		}

		let orderByFields = "";

		if (orderBy) orderByFields += `ORDER BY ${orderBy} ${ordering}`;

		const res = `
			SELECT ${selected.join(",")}
			FROM ${tableName}
			WHERE ${searchFields}
			${orderByFields}
		`;

		if (pagination) {
			let { limit, offset }: SharedTypes.TPagination = pagination;

			if (typeof limit !== "number") limit = 20;
			if (typeof offset !== "number") offset = 0;

			return `
				${res}
				LIMIT ${limit} OFFSET ${offset}
			`;
		}

		return res;
	},

	getCountByParams(
		tableName: string,
		fields: string[],
		nullFields: string[],
	) {
		let searchFields;

		if (fields.length) searchFields = fields.map((e: string) => `${e} = ?`).join(" AND ");
		else searchFields = "1=1";
		if (nullFields.length) {
			if (searchFields) searchFields += ` AND ${nullFields.join(" AND ")}`;
			else searchFields = nullFields.join(",");
		}

		return `
			SELECT COUNT(*) AS count
			FROM ${tableName}
			WHERE ${searchFields}
		`;
	},

	getOneByPk(
		tableName: string,
		primaryKeyField: SharedTypes.TPrimaryKeyField,
	) {
		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = ?`);

			return `
				SELECT *
				FROM ${tableName}
				WHERE ${query.join(" AND ")}
			`;
		}

		return `
			SELECT *
			FROM ${tableName}
			WHERE ${primaryKeyField} = ?
		`;
	},

	save(tableName: string, fields: string[], createField?: string) {
		const intoFields = [];
		const valuesFields = [];

		for (const field of fields.values()) {
			intoFields.push(field);
			valuesFields.push("?");
		}
		if (createField) {
			intoFields.push(createField);
			valuesFields.push("NOW()");
		}

		return `
			INSERT INTO ${tableName} (${intoFields.join(",")})
			VALUES (${valuesFields.join(",")})
		`;
	},

	update(
		tableName: string,
		fields: string[],
		primaryKeyField: SharedTypes.TPrimaryKeyField,
		updateField?: string,
	) {
		let updateFields = fields.map((e: string) => `${e} = ?`).join(",");

		if (updateField) updateFields += `, ${updateField} = NOW()`;

		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = ?`);

			return `
				UPDATE ${tableName}
				SET ${updateFields}
				WHERE ${query.join(" AND ")}
			`;
		}

		return `
			UPDATE ${tableName}
			SET ${updateFields}
			WHERE ${primaryKeyField} = ?
		`;
	},
};
