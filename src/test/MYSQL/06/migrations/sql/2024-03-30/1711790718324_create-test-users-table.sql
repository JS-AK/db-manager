CREATE TABLE test_users(
    id                              CHAR(36) NOT NULL DEFAULT (UUID()),
    id_sec                          CHAR(36) NOT NULL DEFAULT (UUID()),

    first_name                      VARCHAR(255),
    last_name                       VARCHAR(255),
    rating                          INT,
    score                           DOUBLE,

    created_at                      DATETIME DEFAULT (UTC_TIMESTAMP),
    updated_at                      DATETIME,

    PRIMARY KEY (id, id_sec)
);
