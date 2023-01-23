export default {
	delete(tableName: string, primaryKey: string) {
		return `
			DELETE
			FROM ${tableName}
			WHERE ${primaryKey} = $1
			RETURNING ${primaryKey}
		`;
	},

	deleteAll(tableName: string, primaryKey: string) {
		return `
			DELETE
			FROM ${tableName}
			RETURNING ${primaryKey}
		`;
	},

	getByParams(
		tableName: string,
		selectedFields: string,
		searchFields: string,
		orderByFields: string,
		paginationFields: string,
	) {
		return `
			SELECT ${selectedFields}
			FROM ${tableName}
			${searchFields}
			${orderByFields}
			${paginationFields}
		`;
	},

	getCountByParams(tableName: string, searchFields: string) {
		return `
			SELECT COUNT(*)
			FROM ${tableName}
			${searchFields}
		`;
	},

	getCountByPks(primaryKey: string, tableName: string) {
		return `
			SELECT COUNT(*)
			FROM ${tableName}
			WHERE ${primaryKey} = ANY ($1)
		`;
	},

	getCountByPksAndParams(
		primaryKey: string,
		tableName: string,
		searchFields: string,
		orderNumber: number,
	) {
		return `
			SELECT COUNT(*)
			FROM ${tableName}
			${searchFields}
			  AND ${primaryKey} = ANY ($${orderNumber + 1})
		`;
	},

	getOneByPk(tableName: string, primaryKey: string) {
		return `
			SELECT *
			FROM ${tableName}
			WHERE ${primaryKey} = $1
		`;
	},

	save(
		tableName: string,
		fields: string[],
		createField: string,
	) {
		const intoFields = [];
		const valuesFields = [];

		for (const [idx, field] of fields.entries()) {
			intoFields.push(field);
			valuesFields.push(`$${idx + 1}`);
		}
		if (createField) {
			intoFields.push(createField);
			valuesFields.push("NOW()");
		}

		return `
			INSERT INTO ${tableName} (${intoFields.join(",")})
			VALUES (${valuesFields.join(",")})
			ON CONFLICT DO NOTHING
			RETURNING *
		`;
	},

	update(
		tableName: string,
		fields: string[],
		primaryKey: string,
		updateField: string,
	) {
		let idx = 1;
		let updateFields = fields.map((e: string) => `${e} = $${idx++}`).join(",");

		if (updateField) updateFields += `, ${updateField} = NOW()`;

		return `
			UPDATE ${tableName}
			SET ${updateFields}
			WHERE ${primaryKey} = $${idx}
			RETURNING *
		`;
	},
};
