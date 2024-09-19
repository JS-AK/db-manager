CREATE TABLE test_table_01(
    id                              BIGSERIAL PRIMARY KEY,

    books                           TEXT[],
    description                     TEXT,
    meta                            JSONB NOT NULL,
    checklist                       JSONB[],
    number_key                      INT NOT NULL,
    number_range                    INT8RANGE,
    title                           TEXT NOT NULL,

    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE
);
