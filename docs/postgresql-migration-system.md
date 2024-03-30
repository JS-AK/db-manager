# PostgreSQL Migration System

## Overview

The migration system manages PostgreSQL database migrations, providing commands for creating empty SQL migration files, running migrations up, and rolling back migrations down.

## Usage Example

To effectively use the migration system, it's recommended to maintain the following file structure:

```
migrations
    └── sql # Directory for SQL migration files
```

### Running Migrations Up

```javascript
import path from "node:path";
import { PG } from "@js-ak/db-manager";

const creds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "user",
};

const pool = PG.BaseModel.getStandardPool(creds);

await PG.MigrationSystem.Up.start(pool, {
    migrationsTableName: "migration_control",
    pathToSQL: path.resolve(process.cwd(), "migrations", "sql"),
});

await PG.BaseModel.removeStandardPool(creds);
```

### Running Migrations Down

```javascript
import path from "node:path";
import { PG } from "@js-ak/db-manager";

const creds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "user",
};

const pool = PG.BaseModel.getStandardPool(creds);

await PG.MigrationSystem.Down.start(pool, {
    migrationsTableName: "migration_control",
    pathToSQL: path.resolve(process.cwd(), "migrations", "sql"),
});

await PG.BaseModel.removeStandardPool(creds);
```

### Running Create Empty SQL file

```javascript
import path from "node:path";
import { PG } from "@js-ak/db-manager";

await PG.MigrationSystem.CreateEmptySQL.create(
    path.resolve(process.cwd(), "migrations", "sql")
);
```
