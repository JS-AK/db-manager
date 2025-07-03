# Transactions

Transactions in databases are vital for ensuring data integrity and consistency, especially when dealing with multiple operations that need to be executed as a single unit. Here's an examples of using transactions in JavaScript with a PostgreSQL database:

## Pure SQL example

```typescript
import { PG } from "@js-ak/db-manager";

const creds: PG.ModelTypes.TDBCreds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "user",
};

const transactionPool = PG.BaseModel.getTransactionPool(creds);
const client = await transactionPool.connect();

try {
    // Begin the transaction
    await client.query("BEGIN");

    // Retrieve the user role from the database
    const { rows: [userRole] } = await client.query(`
        SELECT id
        FROM user_roles
        WHERE title = $1;
    `, ["admin"]);

    // If user role is not found, throw an error
    if (!userRole) throw new Error("User role not found");

    // Create a new user with the retrieved user role
    const { rows: [user] } = await client.query(`
        INSERT INTO user_roles (first_name, id_user_role)
        VALUES ($1, $2)
        RETURNING id;
    `, ["Foo", userRole.id]);

    // If user creation fails, throw an error
    if (!user) throw new Error("User not create");

    // If all operations succeed, commit the transaction
    await client.query("COMMIT");
} catch (error) {
    // If any error occurs, rollback the transaction
    await client.query("ROLLBACK");

// Log the error message
    console.error(error.message);
} finally {
    // Release the client back to the pool
    client.release();
}

await PG.BaseModel.removeTransactionPool(creds);
```

## Query builder example

```typescript
import { PG } from "@js-ak/db-manager";

const creds: PG.ModelTypes.TDBCreds = {
    database: "database",
    host: "localhost",
    password: "password",
    port: 5432,
    user: "user",
};

const transactionPool = PG.BaseModel.getTransactionPool(creds);
const client = await transactionPool.connect();

try {
    // Begin the transaction
    await client.query("BEGIN");

    // Retrieve the user role from the database
    const [userRole] = await UserRole.model.queryBuilder({ client })
        .select(["id"])
        .where({ params: { title: "admin" } })
        .execute();

    // If user role is not found, throw an error
    if (!userRole) throw new Error("User role not found");

    // Create a new user with the retrieved user role
    const [user] = await User.model.queryBuilder({ client })
        .insert({
            params: {
                first_name: "Foo",
                id_user_role: userRole.id
            }
        })
        .returning(["id"])
        .execute();

    // If user creation fails, throw an error
    if (!user) throw new Error("User not create");

    // If all operations succeed, commit the transaction
    await client.query("COMMIT");
} catch (error) {
    // If any error occurs, rollback the transaction
    await client.query("ROLLBACK");

// Log the error message
    console.error(error.message);
} finally {
    // Release the client back to the pool
    client.release();
}

await PG.BaseModel.removeTransactionPool(creds);
```
