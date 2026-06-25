CREATE TABLE users(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    first_name                      VARCHAR(255),
    last_name                       VARCHAR(255),

    created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
    updated_at                      DATETIME
);
