/* eslint-disable no-console */

import * as User from "./User/index.js";

const creds = {
	database: "postgres",
	host: "localhost",
	password: "admin",
	port: 5432,
	user: "postgres",
};

const UserDomain = new User.Domain(creds);

const user = await UserDomain.createOne({
	firstName: "user firstName",
	lastName: "user lastName",
});

console.log(user);

{
	const { message, one: userFounded } = await UserDomain.getOneByParams({
		params: { firstName: "user firstName" },
		selected: ["id"],
	});

	if (userFounded) {
		console.log(userFounded);

		const userUpdated = await UserDomain.updateOneByPk(userFounded.id, {
			firstName: "user firstName updated",
		});

		console.log(userUpdated);
	} else {
		console.log(message);
	}
}
