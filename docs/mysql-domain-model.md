# MySQL Domain model

## Overview

The MySQL Core module provides essential functionalities for interacting with a MySQL database. It includes a domain layer that encapsulates operations related to entities in the database, offering functionalities for creating, retrieving, updating, and deleting records.

## Prerequisites

Before using the MySQL Core module, ensure the following steps are completed:

1. **Prepare Database**: Set up the MySQL database environment and ensure it is accessible.

2. **Apply Migrations**: [(MySQL Migration System)](mysql-migration-system) Execute necessary database migrations to prepare the database schema for the application. This includes creating tables, defining indexes, and setting up any initial data.

## Usage Example (Modern Structure)

### File Structure

```text
data-access-layer/
  repository-manager.ts
  repository/
    user/
      domain.ts
      types.ts
      index.ts
    index.ts
  index.ts
```

### Example: Using the Domain Model

```typescript
// src/examples/mysql/01/index.ts

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
```

### Example: domain.ts for user

```typescript
// data-access-layer/repository/user/domain.ts

import { MYSQL } from "@js-ak/db-manager";
import * as Types from "./types.js";

export const domain = (dbCreds: MYSQL.ModelTypes.TDBCreds) => {
    return new MYSQL.Repository.Table<{ CoreFields: Types.TableFields; }>({
        dbCreds,
        schema: {
            tableName: "users",
            primaryKey: "id",
            tableFields: [
                "id",
                "first_name",
                "last_name",
                "created_at",
                "updated_at",
            ],
            createField: { title: "created_at", type: "timestamp" },
            updateField: { title: "updated_at", type: "timestamp" },
        },
    });
};
```

### Example: types.ts for user

```typescript
// data-access-layer/repository/user/types.ts

export type TableFields = {
    id: string;
    first_name: string;
    last_name: string;
    created_at: Date;
    updated_at: Date | null;
};

export type CreateFields = Pick<TableFields, "first_name" | "last_name">;
export type UpdateFields = Partial<Pick<TableFields, "first_name" | "last_name">>;
export type EntityFull = Pick<TableFields, "id" | "first_name" | "last_name" | "created_at" | "updated_at">;
export type EntityListed = Pick<TableFields, "id" | "first_name" | "last_name">;
export type SearchFields = Partial<TableFields>;
```

### Example: repository-manager.ts

```typescript
// data-access-layer/repository-manager.ts

import { MYSQL } from "@js-ak/db-manager";
import * as Repository from "./repository/index.js";

export const createRepositoryManager = (creds: MYSQL.ModelTypes.TDBCreds) => new MYSQL.RepositoryManager(
    {
        user: Repository.User.domain(creds),
    },
    { config: creds, isLoggerEnabled: false, logger: console },
);
```
