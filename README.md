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
| Embedding | BAAI/bge-m3 (로컬, 무료) |
| LLM | OpenAI GPT-4o-mini |
| Frontend | Next.js 14 + shadcn/ui + Tailwind |
| Infrastructure | OCI Ampere A1 + Docker Compose |

## 문서

- [기술 스택 결정 (ADR-001)](docs/adr/ADR-001-tech-stack.md)
- [인프라 결정 (ADR-002)](docs/adr/ADR-002-infrastructure.md)
