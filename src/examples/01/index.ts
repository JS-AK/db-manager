/* eslint-disable no-console */

import * as User from "./User/index.js";

const creds = {
	database: "postgres",
	host: "localhost",
	password: "admin",
	port: 5432,
	user: "postgres",
};

const userDomain = User.domain(creds);

const user = await userDomain.createOne({
	firstName: "user firstName",
	lastName: "user lastName",
});

console.log(user);

{
	const { message, one: founded } = await userDomain.getOneByParams({
		params: { firstName: "user firstName" },
		selected: ["id"],
	});

	if (founded) {
		console.log(founded);

		const updated = await userDomain.updateOneByPk(founded.id, {
			firstName: "user firstName updated",
		});

		console.log(updated);
	} else {
		console.log(message);
	}
}
