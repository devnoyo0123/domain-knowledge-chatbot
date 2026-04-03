# ADR-001: 기술 스택 선정 (POC)

| 항목 | 내용 |
|------|------|
| **상태** | Accepted |
| **날짜** | 2026-04-03 |
| **작성자** | 노요섭 |

---

## 컨텍스트

회사 도메인 지식 기반 RAG 챗봇 POC를 구축한다. 요구사항은 다음과 같다.

- 문서(PDF, DOCX, XLSX, 이미지 등) 업로드 → 벡터 인덱싱
- 자연어 질문 → 도메인 지식 검색 → LLM 답변 생성
- 이미지(스크린샷) 입력 지원 (Vision)
- 사용자 채팅 UI + 관리자 UI (지식 추가/삭제/조회수 확인)
- 조회수 기반 지식 수명 관리

POC 단계이므로 **개발 속도와 비용 최소화**를 최우선으로 한다.

---

## 결정

### 백엔드: Python + FastAPI

**채택 이유**
- LangChain 생태계가 RAG 구현에 압도적으로 유리 (Document Loader, Chunking, VectorStore 내장)
- Document 파싱(PDF/DOCX/XLSX/이미지) 라이브러리 생태계가 Python에 집중됨
- POC 기준 Spring Boot + Spring AI 대비 구현 속도 2~3배 빠름

**대안으로 검토한 것**
- Spring Boot 3 + Spring AI: Java 친숙도는 높으나 RAG 생태계 미성숙, Document Loader 직접 구현 필요
- Node.js: AI/ML 라이브러리 부족

**POC 이후**
- 비즈니스 로직이 단순하므로 Spring Boot 마이그레이션 용이

---

### RAG Framework: LangChain

**채택 이유**
- Document Loader, Text Splitter, Embedding, VectorStore, Chain을 통합 제공
- pgvector 연동 지원 (`langchain-postgres`)
- 파일 타입별 파서 내장 (PyPDFLoader, Docx2txtLoader, UnstructuredExcelLoader 등)

---

### Vector DB: PostgreSQL + pgvector

**채택 이유**
- 기존 PostgreSQL 운영 경험 재활용 (백업, 복제, 모니터링 동일)
- 관계형 메타데이터(조회수, 해시, 태그 등)와 벡터를 단일 DB로 관리
- 별도 Vector DB 서비스(Pinecone, Weaviate 등) 불필요 → 인프라 단순화
- HNSW 인덱스로 검색 성능 확보

```sql
CREATE EXTENSION vector;

CREATE TABLE knowledge (
    id             SERIAL PRIMARY KEY,
    content        TEXT NOT NULL,
    embedding      vector(1024),           -- bge-m3 기준
    category       VARCHAR(50),            -- policy / guide / error / process / faq
    title          VARCHAR(255),
    source_file    VARCHAR(255),
    source_type    VARCHAR(20),            -- pdf / image / text / url
    file_hash      VARCHAR(64),            -- 중복 체크
    department     VARCHAR(50),
    tags           TEXT[],
    uploaded_by    VARCHAR(100),
    uploaded_at    TIMESTAMP,
    updated_at     TIMESTAMP,
    version        INT DEFAULT 1,
    hit_count      INT DEFAULT 0,
    last_queried_at TIMESTAMP
);

CREATE INDEX ON knowledge USING hnsw (embedding vector_cosine_ops);
```

---

### Embedding 모델: BAAI/bge-m3 (로컬, 무료)

**채택 이유**
- 완전 무료 (Hugging Face 다운로드 후 로컬 실행)
- 한/영 다국어 지원, 1024차원
- POC 수준에서 OpenAI text-embedding-3-small 대비 품질 차이 미미

**대안으로 검토한 것**
- OpenAI text-embedding-3-small: $0.02/1M 토큰으로 저렴하나 API 비용 발생
- text-embedding-ada-002: 위 대비 5배 비싸고 품질도 낮음

**POC 이후 업그레이드 경로**
- 품질 불만족 시 OpenAI API로 전환 (코드 한 줄 교체, DB 재인덱싱 필요)

```python
# 교체 시 변경 지점
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-m3")
# ↓ 변경
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
```

---

### LLM: OpenAI GPT-4o-mini

**채택 이유**
- Vision(이미지 입력) 지원 → 스크린샷 처리 가능
- 입력 $0.15/1M 토큰으로 GPT-4o 대비 저렴
- 한국어 품질 양호

**예상 비용 (소규모 POC 기준)**
- Embedding: 무료 (로컬)
- LLM 추론: 월 $5~10 이하 (일 100회 기준)

**대안으로 검토한 것**
- Claude 3.5 Haiku: Vision 지원, 비용 유사하나 OpenAI SDK 생태계가 LangChain 연동에 더 안정적
- 로컬 LLM (Ollama): 비용 0이나 한국어 품질 및 Vision 지원 불안정

---

### 프론트엔드: Next.js 14 (App Router)

**채택 이유**
- 채팅 UI + 관리자 UI를 단일 앱으로 구성 가능 (`/chat`, `/admin` 라우트 분리)
- React Server Components로 관리자 페이지 구현 효율 높음
- Vercel 배포 시 추가 인프라 불필요 (POC 단계)

**UI 컴포넌트: shadcn/ui + Tailwind CSS**
- 설치형 컴포넌트로 번들 최소화
- 파일 업로드, 테이블, 채팅 버블 등 필요 컴포넌트 즉시 사용 가능

---

### 인프라: OCI Ampere A1 + Docker Compose

→ 상세 결정 내용은 [ADR-002](./ADR-002-infrastructure.md) 참조

---

## 아키텍처 다이어그램

```
Next.js 14
  ├── /chat          ← 사용자 채팅 UI
  └── /admin         ← 지식 관리 UI
        ↓
   FastAPI (Python)
  ├── POST /chat          ← RAG 처리 (LangChain)
  ├── POST /knowledge     ← 문서 업로드 + 파이프라인
  └── GET/DELETE /knowledge ← 관리자 조회/삭제
        ↓
PostgreSQL + pgvector (Docker)
```

### Knowledge Pipeline

```
원본 문서 (PDF / DOCX / XLSX / 이미지 / 텍스트)
       ↓ LangChain Document Loader
   텍스트 추출
   (이미지 → GPT-4o-mini Vision API → 텍스트)
       ↓ Text Splitter (500~1000 토큰)
   청킹
       ↓ bge-m3 (로컬)
   임베딩 (1024차원 벡터)
       ↓
   pgvector 저장
```

---

## 결과

| 항목 | 선택 |
|------|------|
| 백엔드 | Python 3.11 + FastAPI |
| RAG | LangChain |
| Vector DB | PostgreSQL 16 + pgvector |
| Embedding | BAAI/bge-m3 (로컬, 무료) |
| LLM | OpenAI GPT-4o-mini |
| 프론트엔드 | Next.js 14 + shadcn/ui + Tailwind |
| 인프라 | OCI Ampere A1 + Docker Compose |
| 파일 스토리지 | OCI Object Storage |

---

## 미결 사항

- [ ] 인증/인가 방식 (관리자 UI 접근 제어)
- [ ] 문서 버전 업데이트 시 재인덱싱 전략
- [ ] 조회수 기반 자동 삭제 스케줄러 주기 (현재 안 쓰고 3개월 기준 검토 중)
- [ ] POC → 프로덕션 전환 시 Spring Boot 마이그레이션 여부 재검토
- [ ] Embedding 모델 최종 확정 (bge-m3 vs Qwen3-Embedding-0.6B/4B) — OCI ARM 환경 실측 후 결정
