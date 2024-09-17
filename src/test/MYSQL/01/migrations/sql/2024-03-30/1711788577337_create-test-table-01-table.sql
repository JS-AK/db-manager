CREATE TABLE test_table_01(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    description                     VARCHAR(255),
    title                           VARCHAR(255) NOT NULL,

    created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
    updated_at                      DATETIME
);
