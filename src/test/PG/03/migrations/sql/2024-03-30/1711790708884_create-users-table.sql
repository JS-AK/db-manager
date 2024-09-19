CREATE TABLE users(
    id                              BIGSERIAL PRIMARY KEY,

    id_user_role                    BIGINT,

    first_name                      TEXT,
    last_name                       TEXT,

    deleted_at                      BIGINT,
    is_deleted                      BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                      BIGINT DEFAULT ROUND((EXTRACT(EPOCH FROM NOW()) * (1000)::NUMERIC)),
    updated_at                      BIGINT,

    CONSTRAINT users_user_roles_id_user_role_fk
        FOREIGN KEY(id_user_role)
            REFERENCES user_roles(id) ON DELETE CASCADE
);
