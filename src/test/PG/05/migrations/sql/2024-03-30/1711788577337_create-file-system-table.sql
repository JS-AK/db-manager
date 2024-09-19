CREATE EXTENSION IF NOT EXISTS LTREE;

CREATE TABLE file_system(
    id                              BIGSERIAL PRIMARY KEY,

    name                            TEXT NOT NULL,
    is_folder                       BOOLEAN NOT NULL,
    path                            LTREE NOT NULL,

    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX file_system__path__gist ON file_system USING gist(path);
