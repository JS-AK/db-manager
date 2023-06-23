export default {
	delete(
		tableName: string,
		primaryKeyField: string,
	) {
		return `
			DELETE
			FROM ${tableName}
			WHERE ${primaryKeyField} = $1
			RETURNING ${primaryKeyField}
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
			SELECT COUNT(*) AS count
			FROM ${tableName}
			${searchFields}
		`;
	},

	getCountByPks(primaryKeyField: string, tableName: string) {
		return `
			SELECT COUNT(*) AS count
			FROM ${tableName}
			WHERE ${primaryKeyField} = ANY ($1)
		`;
	},

	getCountByPksAndParams(
		primaryKeyField: string,
		tableName: string,
		searchFields: string,
		orderNumber: number,
	) {
		return `
			SELECT COUNT(*) AS count
			FROM ${tableName}
			${searchFields}
			  AND ${primaryKeyField} = ANY ($${orderNumber + 1})
		`;
	},

	getOneByPk(tableName: string, primaryKeyField: string) {
		return `
			SELECT *
			FROM ${tableName}
			WHERE ${primaryKeyField} = $1
		`;
	},

	save(
		tableName: string,
		fields: string[],
		createField: string,
		onConflict: "ON CONFLICT DO NOTHING" | "",
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
			${onConflict}
			RETURNING *
		`;
	},

	update(
		tableName: string,
		fields: string[],
		primaryKeyField: string,
		updateField: string,
	) {
		let idx = 1;
		let updateFields = fields.map((e: string) => `${e} = $${idx++}`).join(",");

		if (updateField) updateFields += `, ${updateField} = NOW()`;

		return `
			UPDATE ${tableName}
			SET ${updateFields}
			WHERE ${primaryKeyField} = $${idx}
			RETURNING *
		`;
	},
};
