import * as SharedTypes from "../../../shared-types/index.js";

export default {
	deleteAll(tableName: string) {
		return `DELETE FROM ${tableName};`;
	},

	deleteByPk(
		tableName: string,
		primaryKeyField: SharedTypes.TPrimaryKeyField,
	) {
		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = ?`);

			return `DELETE FROM ${tableName} WHERE ${query.join(" AND ")};`;
		}

		return `DELETE FROM ${tableName} WHERE ${primaryKeyField} = ?;`;
	},

	getByParams(
		tableName: string,
		selectedFields: string,
		searchFields: string,
		orderByFields: string,
		paginationFields: string,
	) {
		return `SELECT ${selectedFields} FROM ${tableName}${searchFields}${orderByFields}${paginationFields};`;
	},

	getCountByParams(tableName: string, searchFields: string) {
		return `SELECT COUNT(*) AS count FROM ${tableName}${searchFields};`;
	},

	getOneByPk(
		tableName: string,
		primaryKeyField: SharedTypes.TPrimaryKeyField,
	) {
		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = ?`);

			return `SELECT * FROM ${tableName} WHERE ${query.join(" AND ")};`;
		}

		return `SELECT * FROM ${tableName} WHERE ${primaryKeyField} = ? LIMIT 1;`;
	},

	save(
		tableName: string,
		fields: string[],
		createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
	) {
		const intoFields = [];
		const valuesFields = [];

		for (const field of fields.values()) {
			intoFields.push(field);
			valuesFields.push("?");
		}

		if (createField) {
			intoFields.push(createField.title);

			switch (createField.type) {
				case "timestamp":
					valuesFields.push("UTC_TIMESTAMP()");
					break;
				case "unix_timestamp":
					valuesFields.push("ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)");
					break;

				default:
					throw new Error("Invalid type: " + createField.type);
			}
		}

		return `INSERT INTO ${tableName} (${intoFields.join(",")}) VALUES (${valuesFields.join(",")});`;
	},

	update(
		tableName: string,
		fields: string[],
		primaryKeyField: SharedTypes.TPrimaryKeyField,
		updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
	) {
		let updateFields = fields.map((e: string) => `${e} = ?`).join(",");

		if (updateField) {
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = UTC_TIMESTAMP()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = ?`);

			return `UPDATE ${tableName} SET ${updateFields} WHERE ${query.join(" AND ")};`;
		}

		return `UPDATE ${tableName} SET ${updateFields} WHERE ${primaryKeyField} = ?;`;
	},
};
