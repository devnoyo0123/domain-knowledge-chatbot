# Domain Knowledge Chatbot - 초기 대화 기록

## 프로젝트 개요

회사 도메인 지식을 기반으로 답변하는 지식 어시스턴트(챗봇) 구축 프로젝트.
범용적인 LLM 답변이 아닌, 회사 고유의 도메인 지식 기반으로 정확한 답변을 제공하는 것이 목표.

---

## 1. 용어 정리

- **RAG (Retrieval-Augmented Generation)**: 도메인 지식을 검색해서 LLM 답변에 끼워넣는 방식
- **지식 기반 AI 어시스턴트**: 기업에서 흔히 쓰는 명칭
- **Enterprise Knowledge Bot**: 영어권 명칭
- 일반 "챗봇"과의 차이: 사전 정의된 응답이 아닌, 자유로운 질문에 도메인 지식 기반 답변

### 일반 챗봇 vs 지식 기반 AI 어시스턴트 (RAG)

| 일반 챗봇 | 지식 기반 AI 어시스턴트 (RAG) |
|-----------|-------------------------------|
| 사전 정의된 응답만 | 자유로운 질문에 도메인 지식 기반 답변 |
| 지식 업데이트 = 재개발 | 지식만 추가하면 즉시 반영 |
| 범용 LLM 답변 | 회사 데이터 기반 정확한 답변 |

---

## 2. 전체 아키텍처

```
사용자 질문 (텍스트 + 이미지)
       ↓
  ① 질문 이해 (LLM)
       ↓
  ② 도메인 지식 검색 (Vector DB)
       ↓
  ③ 지식 + 질문 결합 → LLM 답변 생성
       ↓
  도메인 특화 답변
```

### RAG 핵심 동작 원리

```
일반 LLM:  질문 → LLM → 답변 (LLM이 아는 것만)
RAG:       질문 → 검색 → [회사 지식 + 질문] → LLM → 답변
                  ↑
          이게 핵심. LLM 몰라도 회사 지식에서 찾아줌
```

### 동작 예시

```
사용자: "우리 회사 휴가 정책이 어떻게 돼?"
       ↓
  질문을 벡터로 변환: [0.031, -0.022, 0.048, ...]
       ↓
  pgvector에서 유사도 검색
       ↓
  검색 결과:
    Chunk 1: "회사 휴가 정책은 연 15일입니다" (유사도 0.95)
    Chunk 2: "휴가 신청은 사전 3일 전..."       (유사도 0.89)
       ↓
  LLM에게 질문:
  "아래 참고자료를 바탕으로 답변해.
   참고: 회사 휴가 정책은 연 15일입니다...
         휴가 신청은 사전 3일 전...
   질문: 우리 회사 휴가 정책이 어떻게 돼?"
       ↓
  LLM: "당사 휴가 정책은 연 15일이며,
        신청은 사전 3일 전에 해야 합니다."
```

---

## 3. 기술 스택 결정

### Vector DB: PostgreSQL + pgvector

```sql
CREATE EXTENSION vector;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)
);

-- 코사인 유사도 검색
SELECT content, embedding <=> '[0.01, 0.02, ...]'::vector AS distance
FROM documents
ORDER BY distance
LIMIT 5;

-- HNSW 인덱스로 검색 속도 향상
CREATE INDEX ON documents
USING hnsw (embedding vector_cosine_ops);
```

### 선택 이유
- 이미 알고 있는 DB → 학습 비용 제로
- 관계형 + 벡터 동시에 사용 가능
- 운영 경험 그대로 적용 (백업, 복제, 모니터링)
- 별도 Vector DB 서비스 불필요

---

## 4. Knowledge Pipeline (지식 추가 방식)

### 전체 흐름
```
원본 문서 (PDF, 이미지, 텍스트, DOCX ...)
       ↓
  ① 전처리 (Parsing)
       ↓
  ② 청킹 (Chunking) — 작은 단위로 분할 (500~1000토큰)
       ↓
  ③ 임베딩 (Embedding) — 벡터로 변환
       ↓
  ④ pgvector에 저장
       ↓
  질문 시 검색 → LLM 답변
```

### 데이터 타입별 처리

#### 텍스트
```
"회사 휴가 정책은 연 15일입니다..."
       ↓ (Chunking — 500~1000토큰 단위로 분할)
  Chunk 1: "회사 휴가 정책은 연 15일입니다"
  Chunk 2: "휴가 신청은 사전 3일 전..."
       ↓ (Embedding API 호출)
  [0.012, -0.034, 0.056, ...] (1536차원 벡터)
       ↓
  pgvector 저장
```

#### PDF/문서
- **텍스트 기반 PDF** (워드에서 변환): 내부에 텍스트 코드가 있어 파서가 바로 추출
- **스캔/이미지 기반 PDF**: 텍스트가 없고 픽셀만 있음 → OCR 또는 Vision API 필요
- 한 페이지 안에서도 텍스트, 이미지, 표가 섞여 있을 수 있음

PDF 내부는 실제로 코드 형태로 텍스트가 저장됨:
```
%PDF-1.4
BT              ← Begin Text
/F1 12 Tf       ← 폰트 크기 12
(회사 휴가 정책) Tj   ← 텍스트 데이터
ET              ← End Text
```
→ HTML에서 태그 안 텍스트를 추출하는 것과 같은 원리

#### 이미지 (스크린샷 등)
```
이미지 (도식, 표, 다이어그램, 에러 스크린샷)
       ↓ (멀티모달 모델 — Claude Vision 등)
  이미지 → 텍스트 설명 추출
       ↓ (이후 텍스트와 동일)
  Chunking → Embedding → 저장
```

### 지원 가능한 파일 형식

| 타입 | 형식 | 처리 방식 |
|------|------|-----------|
| 문서 | PDF, DOCX, PPTX, HWP | → 텍스트 추출 |
| 텍스트 | TXT, MD, CSV, JSON, HTML | → 그대로 사용 |
| 이미지 | PNG, JPG, GIF, WEBP | → Vision API로 텍스트 설명 추출 |
| 스프레드시트 | XLSX, CSV | → 셀 단위 텍스트 추출 |
| 코드 | Java, Python, SQL 등 | → 주석+코드 텍스트 |
| 오디오 | MP3, WAV | → STT (음성→텍스트) |
| 영상 | MP4 | → 키프레임 추출 + STT |

핵심: **모든 파일 → 결국 "텍스트"로 변환 → 청킹 → 벡터화**

---

## 5. 중복 관리 및 메타데이터

### 해시 기반 중복 체크
- 파일 바이트 단위로 SHA-256 해시 계산
- 모든 파일 타입에 공통 적용
- 같은 파일 중복 등록 방지

### 메타데이터 관리

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536),
    source_file VARCHAR(255),      -- 원본 파일명
    file_hash VARCHAR(64),         -- 파일 해시값
    chunk_index INT,               -- 몇 번째 청크인지
    doc_type VARCHAR(50),          -- text / pdf / image
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP,
    version INT DEFAULT 1
);
```

### 버전 관리 (문서 수정 시)
- 기존 버전 전체 삭제 → 새 버전 저장 (권장)

---

## 6. 임베딩 = 의미를 숫자로 표현

- 임베딩 모델이 텍스트의 "의미"를 1536차원 숫자 배열로 변환
- 단어가 달라도 의미가 같으면 비슷한 벡터가 나옴
  - "휴가는 연 15일입니다" ≈ "Annual leave is 15 days" (다국어 지원)
- 임베딩은 "완벽한 이해"가 아니라 "의미적 유사도 근사치"
- RAG 구조에서 임베딩은 "비슷한 의미 찾기"(대략), LLM이 "실제 독해"(정밀)

---

## 7. 챗봇 입력 처리 (두 가지 케이스)

### Case 1: 글만
```
사용자: "휴가 정책 알려줘"
→ 텍스트 → 벡터 검색 → 답변
```

### Case 2: 스크린샷 + 글
```
사용자: (에러 스크린샷 첨부) + "이거 뭐야?"
→ Vision API로 이미지 분석 → 텍스트 추출 + 질문 텍스트 합침 → 검색 → 답변
```

### 처리 흐름
```
사용자 입력
   ↓
이미지가 있음?
   ├─ YES → Vision API로 이미지 분석 → 텍스트 추출
   │        추출된 텍스트 + 질문 텍스트를 합침
   └─ NO  → 질문 텍스트 그대로 사용
   ↓
통합된 텍스트를 벡터로 변환
   ↓
pgvector에서 유사도 검색
   ↓
검색 결과 + 질문 → LLM → 답변
```

차이는 이미지 유무만 판단해서 텍스트로 변환. 그 뒤는 동일.

---

## 8. 지식 유형 및 활용 시나리오

에러뿐만 아니라 회사 도메인 지식 전반을 대상으로 함.

### 지식 유형

| 지식 유형 | 예시 | 입력 형태 |
|-----------|------|-----------|
| 사내 규정/정책 | 휴가, 경비, 복리후생 | PDF, DOCX |
| 시스템 사용 가이드 | ERP, POS 메뉴얼 | PDF, 스크린샷 |
| 에러 해결 이력 | 에러 스크린샷 + 해결책 | 이미지 + 텍스트 |
| 프로세스/절차 | 결재, 구매, 입사 절차 | 텍스트, 이미지 |
| FAQ | 자주 묻는 질문/답변 | 텍스트 |
| 양식/템플릿 | 이력서, 경비 신청서 | PDF, 엑셀 |

### 에러 스크린샷 활용 시나리오
- 에러 발생 → 스크린샷 찍음 + 해결 내용 저장
- 나중에 같은 에러 발생 시 과거 해결 이력 기반으로 답변
- Vision API가 에러 메시지를 읽어서 텍스트화

---

## 9. 지식 수명 관리 (핵심 결정사항)

### 문제: 해결된 에러, 변경된 정책 등의 오래된 지식이 벡터 DB에 남음

### 결정: 조회수 기반 단순 관리 (복잡한 expired/archived 상태 관리 제외)

```
조회 안 된 지식 = 안 쓰는 지식 = 삭제해도 됨
나중에 필요하면 다시 넣으면 됨
```

```sql
ALTER TABLE knowledge ADD COLUMN hit_count INT DEFAULT 0;
ALTER TABLE knowledge ADD COLUMN last_queried_at TIMESTAMP;
```

- 검색될 때마다 hit_count 증가
- 조회수 0이고 3개월 된 지식 자동 삭제 (스케줄러)
- 관리자는 조회수 기준으로 안 쓰는 지식 식별 후 삭제

### 관리자가 할 일
1. 지식 추가 → 문서/이미지 업로드
2. 가끔 조회수 확인 → 안 쓰는 건 삭제
3. 끝

---

## 10. 관리자 UI 필요성

### 벡터 DB는 사람이 읽을 수 없음
- embedding 컬럼은 1536개 숫자 배열
- 관리자 UI에서 content만 보여주고 embedding은 노출 안 함

### 전체 시스템 구조

```
┌─────────────┐
│  사용자 UI   │  ← 채팅 화면 (질문/답변)
└──────┬──────┘
       │
┌──────▼──────┐
│  백엔드 API  │  ← 질문 처리, RAG 로직
└──────┬──────┘
       │
┌──────▼──────┐
│  pgvector   │  ← 벡터 저장/검색
└─────────────┘

┌─────────────┐
│  관리자 UI   │  ← 지식 추가/삭제, 조회수 확인
└──────┬──────┘
       │
┌──────▼──────┐
│  관리 API    │  ← 관리자 전용 엔드포인트
└──────┬──────┘
       │
┌──────▼──────┐
│  pgvector   │  ← 같은 DB 공유
└─────────────┘
```

채팅 UI + 관리자 UI 두 개를 만들어야 함.

---

## 11. 스크린샷 처리 보완

### 스크린샷 한계
- Vision API가 작은 텍스트를 놓칠 수 있음
- 정확한 숫자/코드 보장 어려움

### 보완 방법
- 스크린샷 + 수동 추가 설명을 같이 저장
- Vision API 자동 설명 + 사람이 작성한 컨텍스트 결합

---

## 12. 최종 결정된 데이터베이스 스키마

```sql
CREATE EXTENSION vector;

CREATE TABLE knowledge (
    id SERIAL PRIMARY KEY,

    -- 콘텐츠
    content TEXT NOT NULL,
    embedding vector(1536),

    -- 분류
    category VARCHAR(50),          -- policy / guide / error / process / faq
    title VARCHAR(255),

    -- 출처
    source_file VARCHAR(255),
    source_type VARCHAR(20),       -- pdf / image / text / url
    file_hash VARCHAR(64),         -- 중복 체크용

    -- 메타
    department VARCHAR(50),
    tags TEXT[],
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP,
    updated_at TIMESTAMP,
    version INT DEFAULT 1,

    -- 사용 추적 (지식 수명 관리)
    hit_count INT DEFAULT 0,
    last_queried_at TIMESTAMP
);

CREATE INDEX ON knowledge
USING hnsw (embedding vector_cosine_ops);
```

---

## 대화 날짜
2026-04-03
