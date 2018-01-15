CREATE TABLE threads (
    id UUID PRIMARY KEY,
    name tsvector
);
CREATE INDEX idx_fts_threads ON threads USING gin(name);

CREATE TABLE thread_messages (
    id UUID PRIMARY KEY,
    content tsvector
);
CREATE INDEX idx_fts_thread_messages ON thread_messages USING gin(content);
