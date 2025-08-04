/* eslint-disable no-console */

import { RepositoryManager } from "./data-access-layer/index.js";

const creds = {
	database: "mysql",
	host: "localhost",
	password: "admin",
	port: 3306,
	user: "mysql",
};

const repositoryManager = RepositoryManager.create(creds);

await repositoryManager.init();

const userRepository = repositoryManager.repository.user;

const user = await userRepository.createOne({
	first_name: "user firstName",
	last_name: "user lastName",
});

console.log({ user });

const { message, one: userFounded } = await userRepository.getOneByParams({
	params: { first_name: "user firstName" },
	selected: ["id"],
});

if (userFounded) {
	console.log({ userFounded });

	await userRepository.updateOneByPk(userFounded.id, {
		first_name: "user firstName updated",
	});

	const { one: userUpdated } = await userRepository.getOneByParams({
		params: { id: userFounded.id },
		selected: ["id"],
	});

	console.log({ userUpdated });
} else {
	console.log({ message });
}
