CREATE TABLE test_table_01(
    id                              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

    books                           JSON,
    description                     TEXT,
    meta                            JSON NOT NULL,
    checklist                       JSON,
    number_key                      INT NOT NULL,
    number_range                    VARCHAR(255),
    title                           VARCHAR(255) NOT NULL,

    created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
    updated_at                      DATETIME
);
