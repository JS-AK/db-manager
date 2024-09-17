CREATE TABLE user_roles(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    title                           VARCHAR(255) UNIQUE NOT NULL,

    created_at                      BIGINT DEFAULT (ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)),
    updated_at                      BIGINT
);

INSERT INTO user_roles (title) VALUES ('admin'), ('head'), ('user');
