# ADR 목록

프로젝트에서 내려진 아키텍처 결정 기록 인덱스.

---

| 번호 | 제목 | 상태 | 날짜 | 파일 |
|------|------|------|------|------|
| ADR-001 | 기술 스택 선정 (POC) | Accepted | 2026-04-03 | [ADR-001-tech-stack.md](../docs/adr/ADR-001-tech-stack.md) |
| ADR-002 | 인프라 선정 (OCI) | Accepted | 2026-04-03 | [ADR-002-infrastructure.md](../docs/adr/ADR-002-infrastructure.md) |

---

## ADR-001 요약: 기술 스택

| 레이어 | 결정 |
|--------|------|
| 백엔드 | Python 3.11 + FastAPI |
| RAG Framework | LangChain |
| Vector DB | PostgreSQL 16 + pgvector |
| Embedding | BAAI/bge-m3 (로컬, 무료) |
| LLM | OpenAI GPT-4o-mini |
| 프론트엔드 | Next.js 14 + shadcn/ui + Tailwind |
| 인프라 | OCI Ampere A1 + Docker Compose |
| 파일 스토리지 | OCI Object Storage |

### 핵심 결정 근거
- **Python FastAPI** 채택: LangChain RAG 생태계, Spring AI 대비 POC 개발 속도 우위
- **bge-m3 로컬 Embedding**: OpenAI Embedding API 비용 제거, 품질 동등
- **pgvector**: 관계형 메타데이터 + 벡터를 단일 DB로 관리, 운영 경험 재활용
- **GPT-4o-mini**: Vision 지원 필수 (스크린샷 입력), 최저 비용

---

## ADR-002 요약: 인프라 (OCI)

| 항목 | 결정 |
|------|------|
| 컴퓨트 | OCI Ampere A1 (4 OCPU, 24GB RAM, ARM, 영구 무료) |
| 파일 스토리지 | OCI Object Storage (10GB, 영구 무료) |
| 배포 방식 | Docker Compose + Nginx |
| 예상 월 비용 | $0 (OCI) + LLM API ~$5~10 |

### 핵심 결정 근거
- **OCI Ampere A1 Always Free**: 24GB RAM으로 로컬 Embedding 모델 실행 가능, AWS/GCP Free Tier(1GB RAM) 대비 압도적
- **ARM 아키텍처 주의**: 모든 Docker 이미지 ARM(aarch64) 호환 확인 필요
- **OCI Object Storage**: 업로드 원본 파일 영구 보관, VM 재생성 시에도 파일 유지
