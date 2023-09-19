/* eslint-disable no-console */

import * as User from "./User/index.js";

const creds = {
	database: "mysql",
	host: "localhost",
	password: "admin",
	port: 3306,
	user: "mysql",
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

		await UserDomain.updateOneByPk(userFounded.id, {
			firstName: "user firstName updated",
		});

		const userUpdated = await UserDomain.getGuaranteedOneByParams({
			params: { id: userFounded.id },
			selected: ["id"],
		});

		console.log(userUpdated);
	} else {
		console.log(message);
	}
}
