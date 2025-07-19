import { BaseTable } from "./table";

const x = new BaseTable<{
	CoreFields: {
		id: string;

		id_user_role: string;

		first_name: string;
		last_name: string;

		delete_at: string;
		is_deleted: boolean;

		created_at: string;
		updated_at: string;
	};
}>(
	{
		createField: { title: "created_at", type: "timestamp" },
		primaryKey: "id",
		tableFields: [
			"id",

			"id_user_role",

			"first_name",
			"is_deleted",
			"last_name",

			"created_at",
			"updated_at",
		],
		tableName: "users",
		updateField: { title: "updated_at", type: "timestamp" },
	},
	{
		database: "postgres",
		host: process.env.POSTGRES_HOST || "localhost",
		password: "admin",
		port: Number(process.env.POSTGRES_PORT) || 5432,
		user: "postgres",
	},
);

x.getCountByParams({ params: { id: { $eq: "1" } } });
