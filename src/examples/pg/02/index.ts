/* eslint-disable no-console */

import { RepositoryManager } from "./data-access-layer/index.js";

const creds = {
	database: "eve",
	host: "localhost",
	password: "admin",
	port: 5432,
	user: "postgres",
};

const repositoryManager = RepositoryManager.create(creds);

await repositoryManager.init();

const invTypeRepository = repositoryManager.repository.invType;

// `selected` uses SQL keys from CoreFields (`"typeID"`), not JS keys (`typeID`).
const { one: invType } = await invTypeRepository.getOneByParams({
	params: { "\"typeID\"": 34 },
	selected: ["\"typeID\"", "\"typeName\""],
});

if (invType) {
	// Row uses JS keys as returned by node-pg — no `as any`.
	console.log({
		name: invType.typeName,
		typeId: invType.typeID,
	});
} else {
	console.log("invType not found");
}

const invTypes = await invTypeRepository.getArrByParams({
	pagination: { limit: 10, offset: 0 },
	params: { published: true },
	selected: ["\"typeID\"", "\"typeName\""],
});

for (const row of invTypes) {
	console.log({
		name: row.typeName,
		typeId: row.typeID,
	});
}
