CREATE TABLE user_roles(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    title                           VARCHAR(255) UNIQUE NOT NULL,

    created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
    updated_at                      DATETIME
);

INSERT INTO user_roles (title) VALUES ('admin'), ('head'), ('user');
