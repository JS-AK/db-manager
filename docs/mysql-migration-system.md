# MySQL Migration System

## Overview

The migration system manages MySQL database migrations, providing commands for creating empty SQL migration files, running migrations up, and rolling back migrations down.

## Usage Example

To effectively use the migration system, it's recommended to maintain the following file structure:

```
migrations
    └── sql # Directory for SQL migration files
```

### Running Migrations Up

```javascript
import path from "node:path";
import { MYSQL } from "@js-ak/db-manager";

const creds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 3306,
    user: "user",
    multipleStatements: true, // !NB for Multiple Statement Execution Support
};

const pool = MYSQL.BaseModel.getStandardPool(creds);

await MYSQL.MigrationSystem.Up.start(pool, {
    migrationsTableName: "migration_control",
    pathToSQL: path.resolve(process.cwd(), "migrations", "sql"),
});

await MYSQL.BaseModel.removeStandardPool(creds);
```

### Running Migrations Down

```javascript
import path from "node:path";
import { MYSQL } from "@js-ak/db-manager";

const creds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 3306,
    user: "user",
    multipleStatements: true, // !NB for Multiple Statement Execution Support
};

const pool = MYSQL.BaseModel.getStandardPool(creds);

await MYSQL.MigrationSystem.Down.start(pool, {
    migrationsTableName: "migration_control",
    pathToSQL: path.resolve(process.cwd(), "migrations", "sql"),
});

await MYSQL.BaseModel.removeStandardPool(creds);
```

### Running Create Empty SQL file

```javascript
import path from "node:path";
import { MYSQL } from "@js-ak/db-manager";

await MYSQL.MigrationSystem.CreateEmptySQL.create(path.resolve(
    process.cwd(), "migrations", "sql")
);
```
