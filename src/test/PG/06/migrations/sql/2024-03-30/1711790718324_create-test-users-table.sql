CREATE TABLE test_users(
    id                              UUID DEFAULT gen_random_uuid(),
    id_sec                          UUID DEFAULT gen_random_uuid(),

    first_name                      TEXT,
    last_name                       TEXT,

    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE,

    CONSTRAINT pk_id_id_sec PRIMARY KEY (id, id_sec)
);
