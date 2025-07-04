# PostgreSQL Domain model

## Overview

The PostgreSQL Core module provides essential functionalities for interacting with a PostgreSQL database. It includes a Domain class that encapsulates operations related to entities in the database, offering functionalities for creating, retrieving, updating, and deleting records.

## Prerequisites

Before using the PostgreSQL Core module, ensure the following steps are completed:

1. **Prepare Database**: Set up the PostgreSQL database environment and ensure it is accessible.

2. **Apply Migrations**: [(PostgreSQL Migration System)](postgresql-migration-system) Execute necessary database migrations to prepare the database schema for the application. This includes creating tables, defining indexes, and setting up any initial data.

## Usage Example

To effectively use the data-access-layer, it"s recommended to maintain the following file structure:

```text
data-access-layer
    ├──────── models     # Directory for storing database models
    │  ├───── entity     # Directory for the entity model
    │  │  ├── domain.js  # Contains the domain logic for the entity model
    │  │  ├── model.js   # Contains the database model definition for the entity
    │  │  └── index.js   # Aggregates exports from domain.js and model.js for entity
    │  └───── index.js   # Aggregates exports for all models
    └──────── index.js   # Entry point for the data access layer
```

```javascript
// data-access-layer/index.js
import { PG } from "@js-ak/db-manager";
import * as Models from "./models/index.js";

export const init = (config) => {
    const repository = {
        entity: new Models.Entity.Domain(config),
    };

    PG.BaseModel.getStandardPool(config).on("error", (error) => {
        console.error(error.message)
    });

    PG.BaseModel.getStandardPool(config).on("connect", (client) => {
        client.on("error", (error) => { console.error(error.message) });
    });

    return { repository };
};

export const shutdown = async (config) => {
  await PG.BaseModel.removeStandardPool(config);
}
```

```javascript
// data-access-layer/models/index.js
export * as Entity from "./entity/index.js";
```

```javascript
// data-access-layer/models/entity/index.js
export * from "./domain.js";
export * from "./model.js";
```

```javascript
// data-access-layer/models/entity/domain.js
import { PG } from "@js-ak/db-manager";
import { Model } from "./model.js";

export class Domain extends PG.BaseDomain {
    constructor(creds) {
        super({ model: new Model(creds) });
    }
}

```

```javascript
// data-access-layer/models/entity/model.js
import { PG } from "@js-ak/db-manager";

export class Model extends PG.BaseModel {
    constructor(creds) {
        super(
            {
                createField: { title: "created_at", type: "timestamp" },
                primaryKey: "id",
                tableFields: ["id", "amount", "amount_range", "first_name", "last_name", "created_at", "updated_at"],
                tableName: "entities",
                updateField: { title: "updated_at", type: "timestamp" },
            },
            creds,
        );
    }
}

```

### External use of data access layer

```javascript
import { init, shutdown } from "./data-access-layer/index.js";

const creds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "user",
};

const { repository } = init(creds);

const entity = await repository.entity.createOne({
    amount: 42,
    first_name: "Foo",
    last_name: "Bar",
});

console.log({ entity });

const { message, one } = await repository.entity.getOneByParams({
    params: { first_name: "Foo" },
    selected: ["id"],
});

if (one) {
    await repository.entity.updateOneByPk(one.id, {
        first_name: "Foo updated",
    });

    const { one: updated } = await repository.entity.getOneByParams({
        params: { id: one.id },
        selected: ["id"],
    });

    console.log({ updated });
} else {
    console.log({ message });
}

await shutdown(creds);
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
