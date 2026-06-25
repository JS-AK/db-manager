CREATE TABLE test_table_02(
    id                              BIGSERIAL PRIMARY KEY,

    description                     TEXT,
    title                           TEXT NOT NULL,

    created_at                      BIGINT DEFAULT ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)),
    updated_at                      BIGINT
);
