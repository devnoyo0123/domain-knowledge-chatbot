CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255),
    content         TEXT NOT NULL,
    embedding       vector(1024),
    category        VARCHAR(50),
    source_type     VARCHAR(20) DEFAULT 'text',
    uploaded_by     VARCHAR(100),
    uploaded_at     TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    hit_count       INT DEFAULT 0,
    last_queried_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS knowledge_embedding_idx
ON knowledge USING hnsw (embedding vector_cosine_ops);
