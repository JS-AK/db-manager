export default {
	deleteAll(tableName: string) {
		return `
			DELETE
			FROM ${tableName}
		`;
	},

	deleteByParams(
		tableName: string,
		searchFields: string,
	) {
		return `
			DELETE
			FROM ${tableName}
			${searchFields}
		`;
	},

	deleteByPk(
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
		createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
		onConflict: "ON CONFLICT DO NOTHING" | "",
	) {
		const intoFields = [];
		const valuesFields = [];

		for (const [idx, field] of fields.entries()) {
			intoFields.push(field);
			valuesFields.push(`$${idx + 1}`);
		}

		if (createField) {
			intoFields.push(createField.title);

			switch (createField.type) {
				case "timestamp":
					valuesFields.push("NOW()");
					break;
				case "unix_timestamp":
					valuesFields.push("(EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)");
					break;

				default:
					throw new Error("Invalid type: " + createField.type);
			}
		}

		return `
			INSERT INTO ${tableName} (${intoFields.join(",")})
			VALUES (${valuesFields.join(",")})
			${onConflict}
			RETURNING *
		`;
	},

	updateByParams(
		tableName: string,
		fields: string[],
		searchFields: string,
		updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
		startOrderNumber: number,
	) {
		let idx = startOrderNumber;
		let updateFields = fields.map((e: string) => `${e} = $${idx++}`).join(",");

		if (updateField) {
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = NOW()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = (EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

		return `
			UPDATE ${tableName}
			SET ${updateFields}
			${searchFields}
			RETURNING *
		`;
	},

	updateByPk(
		tableName: string,
		fields: string[],
		primaryKeyField: string,
		updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
	) {
		let idx = 1;
		let updateFields = fields.map((e: string) => `${e} = $${idx++}`).join(",");

		if (updateField) {
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = NOW()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = (EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

		return `
			UPDATE ${tableName}
			SET ${updateFields}
			WHERE ${primaryKeyField} = $${idx}
			RETURNING *
		`;
	},
};
