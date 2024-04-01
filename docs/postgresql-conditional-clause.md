# Conditional clause

**Params**: An object that defines various operators used in database queries.

**ParamsOr**: An array of objects containing additional conditions for database queries. Each object in the array represents a set of conditions combined using the logical OR operator.

## `:`
`Equal to`
```javascript
await repository.entity.getOneByParams({
    params: { first_name: "Foo" },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE first_name = $1;
```

## `$ ne`
`Not equal to`
```javascript
await repository.entity.getOneByParams({
    params: { first_name: { $ne: "Foo" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE first_name <> $1;
```

## `$ ge`
`Greater than`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $ge: 42 } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount > $1;
```

## `$ gte`
`Greater than or equal to`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $gte: 42 } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount >= $1;
```

## `$ le`
`Less than`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $le: 42 } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount < $1;
```

## `$ lte`
`Less than or equal to`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $lte: 42 } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount <= $1;
```

## `$ @>`
`Contains`
```javascript
await repository.entity.getOneByParams({
    params: { amount_range: {"$@>": "[0,42)" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount_range @> $1;
```

## `$ <@`
`Is contained by`
```javascript
await repository.entity.getOneByParams({
    params: { amount_range: {"$<@": "[0,42)" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount_range <@ $1;
```

## `$ &&`
`Overlaps`
```javascript
await repository.entity.getOneByParams({
    params: { amount_range: {"$&&": "[0,42)" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount_range && $1;
```

## `$ @`
`Matches`
```javascript
await repository.entity.getOneByParams({
    params: { amount_range: {"$@": "[0,42)" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount_range @ $1;
```

## `$ ~`
`Regular expression match`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { "$~": 42 } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount_range ~ $1;
```

## `$ ?`
`Fuzzy search`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { "$?": 42 } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount_range ? $1;
```

## `$ between`
`Between`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $between: [0, 42] } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount BETWEEN $1 AND $2;
```

## `$ in`
`In`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $in: [42] } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount = ANY($1);
```

## `$ like`
`Like`
```javascript
await repository.entity.getOneByParams({
    params: { first_name: { $like: "%Foo%" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE first_name LIKE $1;
```

## `$ ilike`
`Case-insensitive like`
```javascript
await repository.entity.getOneByParams({
    params: { first_name: { $ilike: "%Foo%" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE first_name ILIKE $1;
```

## `$ nbetween`
`Not between`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $nbetween: [0, 42] } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE amount NOT BETWEEN $1 AND $2;
```

## `$ nlike`
`Not like`
```javascript
await repository.entity.getOneByParams({
    params: { first_name: { $nlike: "%Foo%" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE first_name NOT LIKE $1;
```

## `$ nilike`
`Not case-insensitive like`
```javascript
await repository.entity.getOneByParams({
    params: { first_name: { $nilike: "%Foo%" } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE first_name NOT ILIKE $1;
```

## `$ nin`
`Not in`
```javascript
await repository.entity.getOneByParams({
    params: { amount: { $nin: [42] } },
});
```
Equivalent in SQL
```sql
SELECT *
FROM entities
WHERE NOT (amount = ANY($1));
```
