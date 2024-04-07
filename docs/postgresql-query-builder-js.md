# Query builder

## Introduction
The Query Builder is a utility class designed to facilitate the construction of SQL queries programmatically in JavaScript/TypeScript applications, particularly when using PostgreSQL databases. It offers methods for generating various types of SQL queries such as SELECT, INSERT, UPDATE, DELETE, and also provides options for joining tables, filtering data, ordering results, and handling pagination.

## Usage
You can get get Query builder instance from model

```javascript
const qb = repository.entity.model.queryBuilder();
```

Also you can pass optional arguments
```javascript
const qb = repository.entity.model.queryBuilder({
    client, // pg.PoolClient for use query builder in transaction
    tableName, // custom table name for executing queries
});
```

## Methods
Once you have created an instance, you can start building your SQL queries using various methods provided by the Query Builder. Here are some key methods:

### select
Specify columns to select.
```javascript
const qb = repository.entity.model.queryBuilder()
    .select(["column1", "column2"]);
```
Equivalent in SQL
```sql
SELECT column1, column2
FROM entities
```

### insert
Construct an INSERT query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .insert({
        onConflict: "DO NOTHING", // Optional
        params: {
            column1: "Baz",
            column2: "Qux"
        },                        // One object for insert
        params: [{
            column1: "Baz",
            column2: "Qux"
        }],                       // Array of objects for insert
        updateColumn: {           // Optional
            title: "updated_at",  // Column name
            type: "timestamp",    // Column type "timestamp" | "unix_timestamp"
        },
    });
```
Equivalent in SQL
```sql
INSERT INTO entities (column1, column2, updated_at)
VALUES ($1, $2, NOW())
ON CONFLICT DO NOTHING
```

### update
Construct an UPDATE query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .update({
        onConflict: "DO NOTHING", // Optional
        params: {
            column1: "Baz",
            column2: "Qux",
        },                        // Object for update db row
        updateColumn: {           // Optional
            title: "updated_at",  // Column name
            type: "timestamp",    // Column type "timestamp" | "unix_timestamp"
        },
    });
```
Equivalent in SQL
```sql
UPDATE entities
SET column1 = $1, column2 = $2, updated_at = NOW()
ON CONFLICT DO NOTHING
```

### delete
Construct a DELETE query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .delete();
```
Equivalent in SQL
```sql
DELETE FROM entities
```

### leftJoin
Construct LEFT JOIN query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .leftJoin(data: {
        targetTableName: "entity_roles",
        targetTableNameAs: "er",      // Optional
        targetField: "id",
        initialTableName: "entities", // Optional
        initialField: "entity_role_id",
    });
```
Equivalent in SQL
```sql
LEFT JOIN entity_roles er ON er.id = entities.entity_role_id
```

### rightJoin
Construct RIGHT JOIN query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .rightJoin(data: {
        targetTableName: "entity_roles",
        targetTableNameAs: "er",      // Optional
        targetField: "id",
        initialTableName: "entities", // Optional
        initialField: "entity_role_id",
    });
```
Equivalent in SQL
```sql
RIGHT JOIN entity_roles er ON er.id = entities.entity_role_id
```

### innerJoin
Construct INNER JOIN query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .innerJoin(data: {
        targetTableName: "entity_roles",
        targetTableNameAs: "er",      // Optional
        targetField: "id",
        initialTableName: "entities", // Optional
        initialField: "entity_role_id",
    });
```
Equivalent in SQL
```sql
INNER JOIN entity_roles er ON er.id = entities.entity_role_id
```

### fullOuterJoin
Construct FULL OUTER JOIN query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .innerJoin(data: {
        targetTableName: "entity_roles",
        targetTableNameAs: "er",      // Optional
        targetField: "id",
        initialTableName: "entities", // Optional
        initialField: "entity_role_id",
    });
```
Equivalent in SQL
```sql
FULL OUTER JOIN entity_roles er ON er.id = entities.entity_role_id
```

### rawJoin
Construct JOIN query.
```javascript
const qb = repository.entity.model.queryBuilder()
    .innerJoin("INNER JOIN entity_roles er ON er.id = entities.entity_role_id");
```
Equivalent in SQL
```sql
INNER JOIN entity_roles er ON er.id = entities.entity_role_id
```

### where
Add WHERE `parametrized` conditions.

Options see at [conditional clause](postgresql-conditional-clause)

```javascript
const qb = repository.entity.model.queryBuilder()
    .where(data: {
        params: { column1: "Baz", column2: "Qux" };
        paramsOr: [
            { column1: "Baz", column2: "Qux" },
            { column1: "Baz", column2: "Qux" }
        ];
    });
```
Equivalent in SQL
```sql
WHERE
    column1 = $1
    AND column2 = $2
    AND (
        (column1 = $3 AND column2 = $4)
        OR
        (column1 = $5 AND column2 = $6)
    )
```

### rawWhere
Add WHERE `raw` conditions.
```javascript
const qb = repository.entity.model.queryBuilder()
    .rawWhere("column1 = 'Baz' AND column2 = 'Qux'");
```
Equivalent in SQL
```sql
WHERE column1 = 'Baz' AND column2 = 'Qux'
```

### orderBy
Specify ORDER BY clause.
```javascript
const qb = repository.entity.model.queryBuilder()
    .orderBy([
        { column: "column1", sorting: "ASC" },
        { column: "column2", sorting: "DESC" }
    ]);
```
Equivalent in SQL
```sql
ORDER BY column1 ASC, column2 DESC
```

### groupBy
Specify GROUP BY clause.
```javascript
const qb = repository.entity.model.queryBuilder()
    .groupBy(["column1", "column2"]);
```
Equivalent in SQL
```sql
GROUP BY column1, column2
```

### having
Add HAVING `parametrized` conditions.

Options see at [conditional clause](postgresql-conditional-clause)

```javascript
const qb = repository.entity.model.queryBuilder()
    .having(data: {
        params: { column1: "Baz", column2: "Qux" };
        paramsOr: [
            { column1: "Baz", column2: "Qux" },
            { column1: "Baz", column2: "Qux" }
        ];
    });
```
Equivalent in SQL
```sql
HAVING
    column1 = $1
    AND column2 = $2
    AND (
        (column1 = $3 AND column2 = $4)
        OR
        (column1 = $5 AND column2 = $6)
    )
```

### pagination
Add pagination.
```javascript
const qb = repository.entity.model.queryBuilder()
    .pagination({ limit: 10, offset:0 });
```
Equivalent in SQL
```sql
LIMIT $1 OFFSET $2
```

### returning
Specify RETURNING clause.
```javascript
const qb = repository.entity.model.queryBuilder()
    .returning(["column1", "column2"]);
```
Equivalent in SQL
```sql
RETURNING column1, column2
```

### compareQuery
Constructs a comparison query and returns the query string along with its values.

### execute
Executes the constructed SQL query.

## Examples

- `select` query with `where`
```javascript
const entities = await repository.entity.model.queryBuilder()
    .select(["id"])
    .where({ params: { first_name: "Foo" } })
    .execute();
```
Equivalent in SQL
```sql
SELECT id
FROM entities
WHERE first_name = $1;
```

- `select` query with `innerJoin`, `where`, `orderBy` and `pagination`
```javascript
const entities = await repository.entity.model.queryBuilder({ tableName: "entities e" })
    .select(["e.id AS e_id", "er.id AS er_id"])
    .innerJoin({
        initialField: "entity_role_id",
        targetField: "id",
        targetTableName: "entity_roles",
        targetTableNameAs: "er"
    })
    .where({ params: { "e.first_name": "Foo" } })
    .orderBy([{ column: "e.id", sorting: "ASC" }])
    .pagination({ limit: 10, offset:0 })
    .execute();
```
Equivalent in SQL
```sql
SELECT e.id AS e_id, er.id AS er_id
FROM entities e
INNER JOIN entity_roles er ON er.id = e.entity_role_id
WHERE e.first_name = $1
ORDER BY e.id ASC
LIMIT 10 OFFSET 0;
```

- `insert` query
```javascript
const entities = await repository.entity.model.queryBuilder()
    .insert({
        params: { first_name: "Baz", last_name: "Qux" },
        updateColumn: {          // Optional
            title: "updated_at", // Column name
            type: "timestamp"    // Column type "timestamp" | "unix_timestamp"
        },
    })
    .returning(["id"])
    .execute();
```
Equivalent in SQL
```sql
INSERT INTO entities (first_name, last_name)
VALUES ($1, $2)
RETURNING id;
```

- `update` query
```javascript
const entities = await repository.entity.model.queryBuilder()
    .update({
        params: { first_name: "Baz", last_name: "Qux" },
        updateColumn: {          // Optional
            title: "updated_at", // Column name
            type: "timestamp"    // Column type "timestamp" | "unix_timestamp"
        },
    })
    .where({ params: { first_name: "Foo", last_name: "Bar" } })
    .returning(["id"])
    .execute();
```
Equivalent in SQL
```sql
UPDATE entities
SET first_name = $1, last_name = $2
WHERE last_name = $3 AND last_name = $4
RETURNING id;
```

- `delete` query
```javascript
const entities = await repository.entity.model.queryBuilder()
    .delete()
    .where({ params: { first_name: "Foo", last_name: "Bar" } })
    .returning(["id"])
    .execute();
```
Equivalent in SQL
```sql
DELETE
FROM entities
WHERE last_name = $1 AND last_name = $2
RETURNING id;
```
