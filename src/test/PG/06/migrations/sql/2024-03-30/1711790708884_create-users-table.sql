CREATE TABLE users(
    id                              BIGSERIAL PRIMARY KEY,

    first_name                      TEXT,
    last_name                       TEXT,

    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE
);
