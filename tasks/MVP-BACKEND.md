# TASK: MVP Backend 구현

## 목표
FastAPI + LangChain으로 RAG 핵심 2개 엔드포인트를 구현한다.
텍스트 직접 입력으로 지식 저장 → 질문 → 답변 흐름이 동작해야 한다.

## 작업 디렉토리
`/Users/colosseum_nohys/Documents/my/playground/domain-knowledge-chatbot/backend`

## 기술 스펙
- Python 3.11
- FastAPI
- LangChain (`langchain`, `langchain-community`, `langchain-postgres`, `langchain-huggingface`)
- Embedding 모델: `BAAI/bge-m3` (HuggingFace, 로컬 실행, 무료)
- DB: PostgreSQL + pgvector (`psycopg2-binary`)
- 환경변수: `python-dotenv`

## 디렉토리 구조
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           ← FastAPI 앱 진입점
│   ├── config.py         ← 환경변수 로딩
│   ├── database.py       ← DB 연결 및 pgvector 설정
│   ├── embedding.py      ← bge-m3 임베딩 모델 싱글톤
│   └── routers/
│       ├── __init__.py
│       ├── knowledge.py  ← POST /knowledge
│       └── chat.py       ← POST /chat
├── requirements.txt
└── Dockerfile
```

## API 명세

### POST /knowledge
지식을 텍스트로 직접 입력받아 임베딩 후 pgvector에 저장한다.

**Request Body**
```json
{
  "title": "휴가 정책",
  "content": "연차는 연 15일이며 입사 1년 후부터 사용 가능합니다.",
  "category": "policy"
}
```

**Response**
```json
{
  "id": 1,
  "title": "휴가 정책",
  "message": "저장 완료"
}
```

### POST /chat
질문을 받아 pgvector에서 유사 지식을 검색하고 LLM으로 답변을 생성한다.

**Request Body**
```json
{
  "question": "휴가는 몇 일이야?"
}
```

**Response**
```json
{
  "answer": "연차는 연 15일이며...",
  "sources": [
    { "id": 1, "title": "휴가 정책", "content": "연차는 연 15일이며..." }
  ]
}
```

## 구현 상세

### embedding.py
- `BAAI/bge-m3` 모델을 앱 시작 시 1회 로딩 (싱글톤)
- `langchain_huggingface.HuggingFaceEmbeddings` 사용

### database.py
- `langchain_postgres.PGVector` 사용
- connection string은 환경변수 `DATABASE_URL`에서 읽음
- collection_name: `"knowledge"`

### POST /knowledge 흐름
```
텍스트 수신
  → bge-m3로 임베딩 (1024차원)
  → PGVector.add_texts() 저장
  → id, title 반환
```

### POST /chat 흐름
```
질문 수신
  → bge-m3로 질문 임베딩
  → PGVector.similarity_search(k=3) 검색
  → 검색된 context + 질문 → OpenAI GPT-4o-mini 호출
  → 답변 + sources 반환
```

### LLM 프롬프트
```
다음 참고자료를 바탕으로 질문에 답변해주세요.
참고자료에 없는 내용은 "해당 정보가 없습니다"라고 답변하세요.

참고자료:
{context}

질문: {question}
```

### Dockerfile
- `python:3.11-slim` 베이스
- ARM 호환 (platform 미지정, 빌드 환경에서 자동 감지)

### CORS 설정
- `http://localhost:3000` 허용 (Next.js 개발 서버)

## 환경변수 (`.env`에서 로딩)
```
DATABASE_URL=postgresql://postgres:localpassword@db:5432/knowledge_db
OPENAI_API_KEY=sk-...
```

## 완료 조건
- `uvicorn app.main:app --reload` 실행 시 서버 기동
- `POST /knowledge`로 텍스트 저장 성공
- `POST /chat`으로 질문 시 저장된 지식 기반 답변 반환
- `/docs` (Swagger UI) 접근 가능
