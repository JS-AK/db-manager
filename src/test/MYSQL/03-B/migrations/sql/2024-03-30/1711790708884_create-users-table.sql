CREATE TABLE users(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    id_user_role                    BIGINT NOT NULL,

    first_name                      VARCHAR(255),
    last_name                       VARCHAR(255),

    deleted_at                      BIGINT,
    is_deleted                      BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                      BIGINT DEFAULT (ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)),
    updated_at                      BIGINT,

    CONSTRAINT users_user_roles_id_user_role_fk
        FOREIGN KEY(id_user_role)
            REFERENCES user_roles(id) ON DELETE CASCADE
);
