# PostgreSQL Domain model

## Overview

The PostgreSQL Core module provides essential functionalities for interacting with a PostgreSQL database. It includes a domain layer that encapsulates operations related to entities in the database, offering functionalities for creating, retrieving, updating, and deleting records.

## Prerequisites

Before using the PostgreSQL Core module, ensure the following steps are completed:

1. **Prepare Database**: Set up the PostgreSQL database environment and ensure it is accessible.

2. **Apply Migrations**: [(PostgreSQL Migration System)](postgresql-migration-system) Execute necessary database migrations to prepare the database schema for the application. This includes creating tables, defining indexes, and setting up any initial data.

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
// src/examples/pg/01/index.ts

import { RepositoryManager } from "./data-access-layer/index.js";

const creds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "user",
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

import { PG } from "@js-ak/db-manager";
import * as Types from "./types.js";

export const domain = (dbCreds: PG.ModelTypes.TDBCreds) => {
    return new PG.Repository.Table<{ CoreFields: Types.TableFields; }>({
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

import { PG } from "@js-ak/db-manager";
import * as Repository from "./repository/index.js";

export const createRepositoryManager = (creds: PG.ModelTypes.TDBCreds) => new PG.RepositoryManager(
    {
        user: Repository.User.domain(creds),
    },
    { config: creds, isLoggerEnabled: false, logger: console },
);
```

## Domain Core Methods

The `BaseDomain` class encapsulates core methods for performing database operations on entities. These methods provide functionalities for creating, retrieving, updating, and deleting records.

### Methods

- **createOne(create)**: Creates a new record with the provided data.

  Example Usage:

```javascript
const entity = await repository.entity.createOne({
    first_name: "Foo",
    last_name: "Bar",
});
```

Equivalent in SQL

```sql
INSERT INTO entities (first_name, last_name)
VALUES ($1, $2)
RETURNING *;
[1] "Foo"
[2] "Bar"
```

- **deleteAll()**: Deletes all records from the `BaseDomain` assigned table.

  Example Usage:

```javascript
await repository.entity.deleteAll();
```

Equivalent in SQL

```sql
DELETE
FROM entities;
```

- **deleteByParams(options)**: Deletes records based on the specified parameters.

Options see at [conditional clause](postgresql-conditional-clause)

  Example Usage:

```javascript
await repository.entity.deleteByParams({
    params: { first_name: "Foo" },
    paramsOr: [
        { last_name: "Bar" },
        { last_name: "Baz" },
    ],
});
```

Equivalent in SQL

```sql
DELETE
FROM entities
WHERE first_name = $1 AND (last_name = $2 OR last_name = $3);
[1] "Foo"
[2] "Bar"
[3] "Baz"
```

- **deleteOneByPk(pk)**: Deletes a record by its primary key.

  Example Usage:

```javascript
await repository.entity.deleteOneByPk("1");
```

Equivalent in SQL

```sql
DELETE
FROM entities
WHERE id = $1
RETURNING id;
[1] "1"
```

- **getArrByParams(options)**: Retrieves an array of records based on the specified parameters.

Options see at [conditional clause](postgresql-conditional-clause)

  Example Usage:

```javascript
await repository.entity.getArrByParams({
    params: { first_name: "Foo" },
    paramsOr: [
        { last_name: "Bar" },
        { last_name: "Baz" }
    ],
    selected: ["id"],
});
```

Equivalent in SQL

```sql
SELECT id
FROM entities
WHERE first_name = $1 AND (last_name = $2 OR last_name = $3);
[1] "Foo"
[2] "Bar"
[3] "Baz"
```

- **getCountByPks(pks)**: Gets the count of records with the specified primary keys.

  Example Usage:

```javascript
await repository.entity.getCountByPks(["1"]);
```

Equivalent in SQL

```sql
SELECT COUNT(*)
FROM entities
WHERE id = ANY ($1);
[1] ["1"]
```

- **getCountByPksAndParams(pks, options)**: Gets the count of records based on both specified primary keys and parameters.

Options see at [conditional clause](postgresql-conditional-clause)

  Example Usage:

```javascript
await repository.entity.getCountByPksAndParams(["1"],{
    params: { first_name: "Foo" },
    paramsOr: [
        { last_name: "Bar" },
        { last_name: "Baz" }
    ],
});
```

Equivalent in SQL

```sql
SELECT COUNT(*)
FROM entities
WHERE id = ANY ($1) AND first_name = $2 AND (last_name = $3 OR last_name = $4);
[1] ["1"]
[2] "Foo"
[3] "Bar"
[4] "Baz"
```

- **getCountByParams(options)**: Gets the count of records based on the specified parameters.

Options see at [conditional clause](postgresql-conditional-clause)

  Example Usage:

```javascript
await repository.entity.getCountByParams({
    params: { first_name: "Foo" },
    paramsOr: [
        { last_name: "Bar" },
        { last_name: "Baz" }
    ],
});
```

Equivalent in SQL

```sql
SELECT COUNT(*)
FROM entities
WHERE first_name = $1 AND (last_name = $2 OR last_name = $3);
[1] "Foo"
[2] "Bar"
[3] "Baz"
```

- **getOneByParams(options)**: Retrieves a single record based on the specified parameters.

Options see at [conditional clause](postgresql-conditional-clause)

  Example Usage:

```javascript
await repository.entity.getOneByParams({
    params: { first_name: "Foo" },
    paramsOr: [
        { last_name: "Bar" },
        { last_name: "Baz" }
    ],
    selected: ["id"],
});
```

Equivalent in SQL

```sql
SELECT id
FROM entities
WHERE first_name = $1 AND (last_name = $2 OR last_name = $3);
[1] "Foo"
[2] "Bar"
[3] "Baz"
```

- **getOneByPk(pk)**: Retrieves a single record by its primary key.

  Example Usage:

```javascript
await repository.entity.getOneByPk("1");
```

Equivalent in SQL

```sql
SELECT *
FROM entities
WHERE id = $1;
[1] "1"
```

- **updateByParams(options, update)**: Updates records based on the specified parameters.

Options see at [conditional clause](postgresql-conditional-clause)

  Example Usage:

```javascript
await repository.entity.updateOneByPk(
    {
        params: { first_name: "Foo" },
        paramsOr: [
            { last_name: "Bar" },
            { last_name: "Baz" }
        ],
    },
    {
        first_name: "Foo",
        last_name: "Bar",
    }
);
```

Equivalent in SQL

```sql
UPDATE entities
SET first_name = $1, last_name = $2
WHERE first_name = $3 AND (last_name = $4 OR last_name = $5)
RETURNING *;
[1] "Foo"
[2] "Bar"
[3] "Foo"
[4] "Bar"
[5] "Baz"
```

- **updateOneByPk(pk, update)**: Updates a record by its primary key.

  Example Usage:

```javascript
await repository.entity.updateOneByPk("1", {
    first_name: "Foo",
    last_name: "Bar",
});
```

Equivalent in SQL

```sql
UPDATE entities
SET first_name = $2, last_name = $3
WHERE id = $1
RETURNING *;
[1] "1"
[2] "Foo"
[3] "Bar"
```

### Compare Query

The `compareQuery` object provides a set of methods for comparing database queries.

- **createOne**

- **deleteAll**

- **deleteByParams**

- **deleteOneByPk**

- **getArrByParams**

- **getCountByParams**

- **getCountByPks**

- **getCountByPksAndParams**

- **getOneByParams**

- **getOneByPk**

- **updateByParams**

- **updateOneByPk**

These methods are used for performing database queries and comparing the results with the expected outcomes.

### Notes

- Before using these methods, ensure proper initialization and configuration of the `BaseDomain` instance.
- Adjust parameters and data types according to your specific domain requirements.
- Additional methods and functionalities may be available based on the specific implementation of the `BaseDomain` class.
- These methods provide a convenient interface for performing common database operations on entities.
