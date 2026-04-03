# TASK: MVP DB 세팅

## 목표
PostgreSQL + pgvector를 Docker Compose로 로컬에서 실행하고, MVP용 스키마를 초기화한다.

## 작업 디렉토리
`/Users/colosseum_nohys/Documents/my/playground/domain-knowledge-chatbot`

## 생성할 파일

### 1. `docker-compose.yml`
- PostgreSQL 16 + pgvector 이미지: `pgvector/pgvector:pg16`
- 플랫폼: `linux/arm64` (OCI ARM 환경과 동일하게 맞춤, 로컬 Mac도 ARM)
- 포트: `5432:5432`
- 볼륨: `pgdata`로 데이터 영속화
- 환경변수: `.env` 파일에서 읽음
- healthcheck 포함

### 2. `.env.example`
아래 변수 포함:
```
POSTGRES_DB=knowledge_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=localpassword
DATABASE_URL=postgresql://postgres:localpassword@localhost:5432/knowledge_db
OPENAI_API_KEY=sk-...
```

### 3. `.gitignore`
`.env` 파일 제외, Python/Node 기본 ignore 패턴 포함

### 4. `db/init.sql`
아래 스키마 그대로 생성:

```sql
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
```

## 완료 조건
- `docker-compose up -d` 실행 시 컨테이너 정상 기동
- `psql`로 접속하여 `knowledge` 테이블 존재 확인
