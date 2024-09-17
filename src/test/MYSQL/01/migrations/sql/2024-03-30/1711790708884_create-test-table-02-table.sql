CREATE TABLE test_table_02(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    description                     VARCHAR(255),
    title                           VARCHAR(255) NOT NULL,

    created_at                      BIGINT DEFAULT (ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000)),
    updated_at                      BIGINT
);
