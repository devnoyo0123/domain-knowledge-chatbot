# Domain Knowledge Chatbot

도메인 지식 기반 RAG(Retrieval-Augmented Generation) 챗봇 프로젝트.

범용 LLM 답변이 아닌, 특정 도메인 지식(규정, 시스템 가이드, 에러 해결 이력 등)을 기반으로 정확한 답변을 제공하는 것이 목표입니다.

## 주요 기능

- 문서 업로드 및 자동 인덱싱 (PDF, DOCX, XLSX, 이미지 등)
- 자연어 질문 → 도메인 지식 검색 → LLM 답변 생성
- 이미지(스크린샷) 첨부 질문 지원 (Vision)
- 관리자 UI: 지식 추가/삭제/조회수 확인

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Backend | Python 3.11 + FastAPI + LangChain |
| Vector DB | PostgreSQL + pgvector |
| Embedding | BAAI/bge-m3 via Ollama (로컬, 무료) |
| LLM | qwen2.5:7b via Ollama (로컬, 무료) |
| Frontend | Next.js 14 + shadcn/ui + Tailwind |
| Infrastructure | OCI Ampere A1 + Docker Compose |

---

## 실행 방법

### 사전 준비

[Ollama](https://ollama.com) 설치 후 모델 2개를 다운로드합니다.

```bash
ollama pull bge-m3       # Embedding 모델 (~570MB)
ollama pull qwen2.5:7b   # LLM 모델 (~4.7GB)
```

### 1. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 내용 (기본값으로 바로 사용 가능):
```
POSTGRES_DB=knowledge_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=localpassword
DATABASE_URL=postgresql://postgres:localpassword@db:5432/knowledge_db
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=bge-m3
```

### 2. DB 실행

```bash
docker-compose up -d db
```

### 3. 백엔드 실행

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API 서버: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

- 채팅: http://localhost:3000/chat
- 지식 추가: http://localhost:3000/admin

### 5. 동작 확인

1. `/admin`에서 지식 추가 (제목 + 내용 입력 후 저장)
2. `/chat`에서 관련 질문 입력
3. 저장한 지식 기반으로 답변 확인

---

## 문서

- [기술 스택 결정 (ADR-001)](docs/adr/ADR-001-tech-stack.md)
- [인프라 결정 (ADR-002)](docs/adr/ADR-002-infrastructure.md)
