import * as SharedTypes from "../../../shared-types/index.js";

export default {
	/**
	 * Generates an SQL `INSERT` statement for inserting multiple rows into a table.
	 *
	 * @param {Object} data - Data required to build the SQL query.
	 * @param {string[][]} data.fields - An array of arrays where each sub-array represents the values for one row.
	 * @param {string[]} data.headers - An array of strings representing the column names.
	 * @param {string} data.onConflict - A string to handle conflicts (e.g., "ON CONFLICT DO NOTHING").
	 * @param {string[]} [data.returning] - An optional array of column names to return after the insert.
	 * @param {string} data.tableName - The name of the table to insert into.
	 * @returns {string} - The generated SQL `INSERT` statement.
	 */
	createMany(data: {
		fields: string[][];
		headers: string[];
		onConflict: string;
		returning?: string[];
		tableName: string;
	}): string {
		let idx = 0;

		return `INSERT INTO ${data.tableName} (${data.headers.join(",")}) VALUES (${data.fields.map((e) => e.map(() => "$" + ++idx)).join("),(")}) ${data.onConflict} RETURNING ${data.returning?.length ? data.returning.join(",") : "*"};`;
	},

	/**
	 * Generates an SQL `INSERT` statement for inserting a single row into a table.
	 *
	 * @param {string} tableName - The name of the table to insert into.
	 * @param {string[]} fields - An array of strings representing the column names to insert values into.
	 * @param {Object|null} createField - An optional field to automatically set a timestamp or unix timestamp.
	 * @param {string} createField.title - The name of the column for the timestamp.
	 * @param {"unix_timestamp"|"timestamp"} createField.type - The type of timestamp to insert.
	 * @param {string} onConflict - A string to handle conflicts (e.g., "ON CONFLICT DO NOTHING").
	 * @param {string[]} [returning] - An optional array of column names to return after the insert.
	 * @returns {string} - The generated SQL `INSERT` statement.
	 * @throws {Error} If an invalid `createField.type` is provided.
	 */
	createOne(
		tableName: string,
		fields: string[],
		createField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
		onConflict: string,
		returning?: string[],
	): string {
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
					valuesFields.push("ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))");
					break;

				default:
					throw new Error("Invalid type: " + createField.type);
			}
		}

		return `INSERT INTO ${tableName} (${intoFields.join(",")}) VALUES (${valuesFields.join(",")}) ${onConflict} RETURNING ${returning?.length ? returning.join(",") : "*"};`;
	},

	/**
	 * Generates an SQL `DELETE` statement to delete all rows from a table.
	 *
	 * @param {string} tableName - The name of the table to delete from.
	 * @returns {string} - The generated SQL `DELETE` statement.
	 */
	deleteAll(tableName: string): string {
		return `DELETE FROM ${tableName};`;
	},

	/**
	 * Generates an SQL `DELETE` statement based on provided search conditions.
	 *
	 * @param {string} tableName - The name of the table to delete from.
	 * @param {string} searchFields - The search conditions for the `WHERE` clause.
	 * @returns {string} - The generated SQL `DELETE` statement.
	 */
	deleteByParams(
		tableName: string,
		searchFields: string,
	): string {
		return `DELETE FROM ${tableName}${searchFields};`;
	},

	/**
	 * Generates an SQL `DELETE` statement to delete a row or rows based on primary key(s).
	 *
	 * @param {string} tableName - The name of the table to delete from.
	 * @param {SharedTypes.TPrimaryKeyField} primaryKeyField - The primary key(s) of the row(s) to delete.
	 * @returns {string} - The generated SQL `DELETE` statement.
	 */
	deleteByPk(
		tableName: string,
		primaryKeyField: SharedTypes.TPrimaryKeyField,
	): string {
		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e, idx) => `${e} = $${++idx}`);
			const returning = primaryKeyField.join(", ");

			return `DELETE FROM ${tableName} WHERE ${query.join(" AND ")} RETURNING ${returning};`;
		}

		return `DELETE FROM ${tableName} WHERE ${primaryKeyField} = $1 RETURNING ${primaryKeyField};`;
	},

	/**
	 * Generates an SQL `SELECT` statement to retrieve rows based on search conditions, ordering, and pagination.
	 *
	 * @param {string} tableName - The name of the table to select from.
	 * @param {string} selectedFields - The columns to select.
	 * @param {string} searchFields - The search conditions for the `WHERE` clause.
	 * @param {string} orderByFields - The ordering for the `ORDER BY` clause.
	 * @param {string} paginationFields - The pagination for the `LIMIT` and `OFFSET` clauses.
	 * @returns {string} - The generated SQL `SELECT` statement.
	 */
	getByParams(
		tableName: string,
		selectedFields: string,
		searchFields: string,
		orderByFields: string,
		paginationFields: string,
	): string {
		return `SELECT ${selectedFields} FROM ${tableName}${searchFields}${orderByFields}${paginationFields};`;
	},

	/**
	 * Generates an SQL `SELECT COUNT` statement to count rows that match specific composite primary keys.
	 *
	 * @param {string[]} primaryKeyFields - The primary key fields to use for the condition.
	 * @param {string} tableName - The name of the table to count rows from.
	 * @param {number} pksCount - The number of primary key sets to match.
	 * @returns {string} - The generated SQL `SELECT COUNT` statement.
	 */
	getCountByCompositePks(
		primaryKeyFields: string[],
		tableName: string,
		pksCount: number,
	): string {
		const conditions = [];

		for (let i = 0; i < pksCount; i++) {
			const condition = primaryKeyFields
				.map((field, index) => `${field} = $${i * primaryKeyFields.length + index + 1}`)
				.join(" AND ");

			conditions.push(`(${condition})`);
		}

		const whereClause = conditions.join(" OR ");

		return `SELECT COUNT(*) AS count FROM ${tableName} WHERE ${whereClause};`;
	},

	/**
	 * Generates an SQL `SELECT COUNT` statement to count rows that match specific composite primary keys and additional conditions.
	 *
	 * @param {string[]} primaryKeyFields - The primary key fields to use for the condition.
	 * @param {string} tableName - The name of the table to count rows from.
	 * @param {string} searchFields - The search conditions for the `WHERE` clause.
	 * @param {number} orderNumber - The starting index for the parameterized query.
	 * @param {number} pksCount - The number of primary key sets to match.
	 * @returns {string} - The generated SQL `SELECT COUNT` statement.
	 */
	getCountByCompositePksAndParams(
		primaryKeyFields: string[],
		tableName: string,
		searchFields: string,
		orderNumber: number,
		pksCount: number,
	): string {
		const conditions = [];

		for (let i = 0; i < pksCount; i++) {
			const condition = primaryKeyFields
				.map((field, index) => `${field} = $${orderNumber + 1 + i * primaryKeyFields.length + index}`)
				.join(" AND ");

			conditions.push(`(${condition})`);
		}

		const compositePkCondition = conditions.join(" OR ");

		return `SELECT COUNT(*) AS count FROM ${tableName} ${searchFields} AND (${compositePkCondition});`;
	},

	/**
	 * Generates an SQL `SELECT COUNT` statement to count rows based on search conditions.
	 *
	 * @param {string} tableName - The name of the table to count rows from.
	 * @param {string} searchFields - The search conditions for the `WHERE` clause.
	 * @returns {string} - The generated SQL `SELECT COUNT` statement.
	 */
	getCountByParams(tableName: string, searchFields: string): string {
		return `SELECT COUNT(*) AS count FROM ${tableName}${searchFields};`;
	},

	/**
	 * Generates an SQL `SELECT COUNT` statement to count rows that match a list of primary keys.
	 *
	 * @param {string} primaryKeyField - The primary key field to match.
	 * @param {string} tableName - The name of the table to count rows from.
	 * @returns {string} - The generated SQL `SELECT COUNT` statement.
	 */
	getCountByPks(
		primaryKeyField: string,
		tableName: string,
	): string {
		return `SELECT COUNT(*) AS count FROM ${tableName} WHERE ${primaryKeyField} = ANY ($1);`;
	},

	/**
	 * Generates an SQL `SELECT COUNT` statement to count rows that match a list of primary keys and additional conditions.
	 *
	 * @param {string} primaryKeyField - The primary key field to match.
	 * @param {string} tableName - The name of the table to count rows from.
	 * @param {string} searchFields - The search conditions for the `WHERE` clause.
	 * @param {number} orderNumber - The starting index for the parameterized query.
	 * @returns {string} - The generated SQL `SELECT COUNT` statement.
	 */
	getCountByPksAndParams(
		primaryKeyField: string,
		tableName: string,
		searchFields: string,
		orderNumber: number,
	): string {
		return `SELECT COUNT(*) AS count FROM ${tableName}${searchFields} AND ${primaryKeyField} = ANY ($${orderNumber + 1});`;
	},

	/**
	 * Generates an SQL `SELECT` statement to retrieve a single row based on the primary key(s).
	 *
	 * @param {string} tableName - The name of the table to select from.
	 * @param {SharedTypes.TPrimaryKeyField} primaryKeyField - The primary key(s) of the row to retrieve.
	 * @returns {string} - The generated SQL `SELECT` statement.
	 */
	getOneByPk(
		tableName: string,
		primaryKeyField: SharedTypes.TPrimaryKeyField,
	): string {
		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e, idx) => `${e} = $${++idx}`);

			return `SELECT * FROM ${tableName} WHERE ${query.join(" AND ")} LIMIT 1;`;
		}

		return `SELECT * FROM ${tableName} WHERE ${primaryKeyField} = $1 LIMIT 1;`;
	},

	/**
	 * Generates an SQL `UPDATE` statement to update rows based on search conditions.
	 *
	 * @param {string} tableName - The name of the table to update.
	 * @param {string[]} fields - The columns to update.
	 * @param {string} searchFields - The search conditions for the `WHERE` clause.
	 * @param {Object|null} updateField - An optional field to automatically set a timestamp or unix timestamp.
	 * @param {string} updateField.title - The name of the column for the timestamp.
	 * @param {"unix_timestamp"|"timestamp"} updateField.type - The type of timestamp to insert.
	 * @param {number} startOrderNumber - The starting index for the parameterized query.
	 * @param {string[]} [returning] - An optional array of column names to return after the update.
	 * @returns {string} - The generated SQL `UPDATE` statement.
	 * @throws {Error} If an invalid `updateField.type` is provided.
	 */
	updateByParams(
		tableName: string,
		fields: string[],
		searchFields: string,
		updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
		startOrderNumber: number,
		returning?: string[],
	): string {
		let idx = startOrderNumber;
		let updateFields = fields.map((e: string) => `${e} = $${idx++}`).join(",");

		if (updateField) {
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = NOW()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

		return `UPDATE ${tableName} SET ${updateFields}${searchFields} RETURNING ${returning?.length ? returning.join(",") : "*"};`;
	},

	/**
	 * Generates an SQL `UPDATE` statement to update a row or rows based on primary key(s).
	 *
	 * @param {string} tableName - The name of the table to update.
	 * @param {string[]} fields - The columns to update.
	 * @param {SharedTypes.TPrimaryKeyField} primaryKeyField - The primary key(s) of the row(s) to update.
	 * @param {Object|null} updateField - An optional field to automatically set a timestamp or unix timestamp.
	 * @param {string} updateField.title - The name of the column for the timestamp.
	 * @param {"unix_timestamp"|"timestamp"} updateField.type - The type of timestamp to insert.
	 * @param {string[]} [returning] - An optional array of column names to return after the update.
	 * @returns {string} - The generated SQL `UPDATE` statement.
	 * @throws {Error} If an invalid `updateField.type` is provided.
	 */
	updateByPk(
		tableName: string,
		fields: string[],
		primaryKeyField: SharedTypes.TPrimaryKeyField,
		updateField: { title: string; type: "unix_timestamp" | "timestamp"; } | null,
		returning?: string[],
	): string {
		let idx = 1;
		let updateFields = fields.map((e: string) => `${e} = $${idx++}`).join(",");

		if (updateField) {
			switch (updateField.type) {
				case "timestamp":
					updateFields += `, ${updateField.title} = NOW()`;
					break;
				case "unix_timestamp":
					updateFields += `, ${updateField.title} = ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC))`;
					break;

				default:
					throw new Error("Invalid type: " + updateField.type);
			}
		}

		if (Array.isArray(primaryKeyField)) {
			const query = primaryKeyField.map((e) => `${e} = $${idx++}`);

			return `UPDATE ${tableName} SET ${updateFields} WHERE ${query.join(" AND ")} RETURNING ${returning?.length ? returning.join(",") : "*"};`;
		}

		return `UPDATE ${tableName} SET ${updateFields} WHERE ${primaryKeyField} = $${idx} RETURNING ${returning?.length ? returning.join(",") : "*"};`;
	},
};
