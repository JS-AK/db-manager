# MySQL core

## Overview

The MySQL Core module provides essential functionalities for interacting with a MySQL database. It includes a Domain class that encapsulates operations related to entities in the database, offering functionalities for creating, retrieving, updating, and deleting records.

## Prerequisites

Before using the MySQL Core module, ensure the following steps are completed:

1. **Prepare Database**: Set up the MySQL database environment and ensure it is accessible.

2. **Apply Migrations**: [(MySQL Migration System)](mysql-migration-system) Execute necessary database migrations to prepare the database schema for the application. This includes creating tables, defining indexes, and setting up any initial data.

## Usage Example

To effectively use the data-access-layer, it's recommended to maintain the following file structure:

```
data-access-layer
    ├──────── models     # Directory for storing database models
    │  ├───── entity     # Directory for the entity model
    │  │  ├── domain.js  # Contains the domain logic for the entity model
    │  │  ├── model.js   # Contains the database model definition for the entity
    │  │  └── index.js   # Aggregates exports from domain.js and model.js for entity
    │  └───── index.js   # Aggregates exports for all models
    └──────── index.js   # Entry point for the data access layer
```

### data-access-layer/index.js
```javascript
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

### data-access-layer/models/index.js
```javascript
export * as Entity from "./entity/index.js";

```

### data-access-layer/entity/index.js
```javascript
export * from "./domain.js";
export * from "./model.js";

```

### data-access-layer/entity/domain.js
```javascript
import { MYSQL } from "@js-ak/db-manager";

import { Model } from "./model.js";

export class Domain extends MYSQL.BaseDomain {
    constructor(creds) {
        super({ model: new Model(creds) });
    }
}

```

### data-access-layer/entity/model.js
```javascript
import { MYSQL } from "@js-ak/db-manager";

export class Model extends MYSQL.BaseModel {
    constructor(creds) {
        super(
            {
                createField: { title: "created_at", type: "timestamp" },
                primaryKey: "id",
                tableFields: ["id", "first_name", "last_name", "created_at", "updated_at"],
                tableName: "users",
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

const { repository } = await init(creds)

const entity = await repository.entity.createOne({
    first_name: "firstName",
    last_name: "lastName",
});

console.log({ entity });

const { message, one } = await repository.entity.getOneByParams({
    params: { first_name: "firstName" },
    selected: ["id"],
});

if (one) {
   await repository.entity.updateOneByPk(one.id, {
        first_name: "firstName updated",
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
