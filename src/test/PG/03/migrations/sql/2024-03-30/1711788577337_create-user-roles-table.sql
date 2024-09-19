CREATE TABLE user_roles(
    id                              BIGSERIAL PRIMARY KEY,

    title                           TEXT UNIQUE,
		
    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                      TIMESTAMP WITH TIME ZONE
);

INSERT INTO user_roles (title) VALUES ('admin'), ('head'), ('user');
