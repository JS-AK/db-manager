/* eslint-disable no-console */

import { UserDM } from "./User/domain-model";

const creds = {
	database: "postgres",
	host: "localhost",
	password: "admin",
	port: 5432,
	user: "postgres",
};

const userDM = new UserDM(creds);

const user = await userDM.createOne({
	firstname: "user firstname",
	lastname: "user secondname",
});

console.log(user);

{
	const { message, one: userFounded } = await userDM.getOneByParams({
		params: { firstname: "user firstname" },
		selected: ["id"],
	});

	if (userFounded) {
		console.log(userFounded);

		const userUpdated = await userDM.updateOneByPk(userFounded.id, {
			firstname: "user firstname updated",
		});

		console.log(userUpdated);
	} else {
		console.log(message);
	}
}
