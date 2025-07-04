# MySQL Domain model

## Overview

The MySQL Core module provides essential functionalities for interacting with a MySQL database. It includes a Domain class that encapsulates operations related to entities in the database, offering functionalities for creating, retrieving, updating, and deleting records.

## Prerequisites

Before using the MySQL Core module, ensure the following steps are completed:

1. **Prepare Database**: Set up the MySQL database environment and ensure it is accessible.

2. **Apply Migrations**: [(MySQL Migration System)](mysql-migration-system) Execute necessary database migrations to prepare the database schema for the application. This includes creating tables, defining indexes, and setting up any initial data.

## Usage

To effectively use the data-access-layer, it's recommended to maintain the following file structure:

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
import { MYSQL } from "@js-ak/db-manager";
import * as Models from "./models/index.js";

export const init = (config) => {
    const repository = {
        entity: new Models.Entity.Domain(config),
    };

    return { repository };
};

export const shutdown = async (config) => {
  await MYSQL.BaseModel.removeStandardPool(config);
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
import { MYSQL } from "@js-ak/db-manager";
import { Model } from "./model.js";

export class Domain extends MYSQL.BaseDomain {
    constructor(creds) {
        super({ model: new Model(creds) });
    }
}

```

```javascript
// data-access-layer/models/entity/model.js
import { MYSQL } from "@js-ak/db-manager";

export class Model extends MYSQL.BaseModel {
    constructor(creds) {
        super(
            {
                createField: { title: "created_at", type: "timestamp" },
                primaryKey: "id",
                tableFields: ["id", "first_name", "last_name", "created_at", "updated_at"],
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
    port: 3306,
    user: "user",
};

const { repository } = init(creds);

const entity = await repository.entity.createOne({
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
