# RepositoryManager

## Overview

`RepositoryManager` is the main class for managing repositories, the query builder factory, and transactions in db-manager for both PostgreSQL and MySQL. It encapsulates connection pool management, logging, transactions, and provides convenient access to your domain models.

## Main Features

- Connection pool management (shared/individual)
- Centralized access to repositories (domain models)
- QueryBuilder factory for building SQL queries
- Transaction management (`executeTransaction`)
- Flexible logging

## Usage Example

```javascript
import { PG } from "@js-ak/db-manager";
import { UserDomain, UserRoleDomain } from "./repository";

const repository = {
    user: { model: new UserDomain(creds) },
};

const manager = new PG.RepositoryManager(repository, {
    config: creds,
    logger: console,
    isLoggerEnabled: true,
    isUseSharedPool: true,
});

await manager.init();

// Using repositories
const user = await manager.repository.user.getOneByParams({ params: { id: 1 } });

// Using QueryBuilderFactory
const qb = manager.queryBuilderFactory.createQueryBuilder();

await qb
    .select(["id", "firstName", "lastName"])
    .from("users")
    .where({ params: { id: "1" } })
    .execute();


// Transaction
await manager.executeTransaction(async (client) => {
    // ... transactional operations
});

await manager.shutdown();
```

## Key Methods and Properties

| Method/Property           | Description                                            |
|---------------------------|--------------------------------------------------------|
| `constructor`             | Initializes the manager with repositories and options  |
| `init()`                  | Checks the connection and initializes the manager      |
| `shutdown()`              | Properly closes connections (if not using shared pool) |
| `repository`              | Object with your domain models                         |
| `queryBuilderFactory`     | Factory for creating QueryBuilders                     |
| `standardPool`            | Pool for regular queries                               |
| `transactionPool`         | Pool for transactions                                  |
| `executeTransaction(fn)`  | Executes a function within a transaction               |

## Constructor Options

- `config` — database connection parameters
- `logger` — logger object (e.g., `console`)
- `isLoggerEnabled` — enable query logging
- `isUseSharedPool` — use shared connection pool (default: true)
- `isDisableSharedPool` — disable shared pool (default: false)

## Notes

- The interface and behavior are identical for both MySQL and PostgreSQL.
- If you use a non-shared pool, don't forget to call `shutdown()` to release resources.
