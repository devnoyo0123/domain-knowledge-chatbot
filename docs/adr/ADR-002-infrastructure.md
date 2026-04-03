# ADR-002: 인프라 선정 (OCI)

| 항목 | 내용 |
|------|------|
| **상태** | Accepted |
| **날짜** | 2026-04-03 |
| **작성자** | 노요섭 |

---

## 컨텍스트

POC 서비스를 외부 접근 가능한 환경에 배포해야 한다. 비용 최소화가 최우선이며, 추후 프로덕션 전환 가능성도 고려한다.

요구사항:
- 로컬 Embedding 모델 실행 가능한 RAM (최소 8GB 이상)
- PostgreSQL + pgvector 실행
- 업로드 파일 영구 저장소
- 무료 또는 최저 비용

---

## 결정

### 컴퓨트: OCI Ampere A1 (Always Free)

**채택 이유**
- Always Free 영구 무료: 4 OCPU + 24GB RAM (ARM/aarch64)
- 24GB RAM → bge-m3(568M) 또는 Qwen3-Embedding-0.6B 로컬 실행 가능
- PostgreSQL + FastAPI + Next.js + Nginx 전부 단일 VM에 수용 가능

**스펙**

| 항목 | 제공량 |
|------|--------|
| OCPU | 4 (ARM Ampere A1) |
| RAM | 24 GB |
| Block Storage | 200 GB |
| 네트워크 아웃바운드 | 10 TB/월 |
| 비용 | **영구 무료** |

**주의: ARM 아키텍처**

Ampere A1은 aarch64(ARM)이므로 모든 Docker 이미지가 ARM을 지원해야 한다.

| 컴포넌트 | ARM 지원 여부 |
|---------|-------------|
| `pgvector/pgvector:pg16` | ✅ multi-arch 이미지 제공 |
| Python 3.11 + FastAPI | ✅ |
| Node.js + Next.js | ✅ |
| BAAI/bge-m3 (HuggingFace) | ✅ CPU 추론 가능 |
| Qwen3-Embedding-0.6B | ✅ CPU 추론 가능 |

**대안으로 검토한 것**
- AWS EC2 Free Tier (t2.micro, 1GB RAM): RAM 부족, Embedding 모델 실행 불가
- GCP Free Tier (e2-micro, 1GB RAM): 동일 이유로 부적합
- Vultr/DigitalOcean: 유료, 월 $6~12 발생

---

### 파일 스토리지: OCI Object Storage (Always Free)

**채택 이유**
- Always Free 10GB 제공 (POC 충분)
- VM 디스크 대신 Object Storage 사용 → VM 재생성 시 파일 보존
- Python OCI SDK로 연동

**파일 흐름**
```
관리자 업로드
      ↓
FastAPI 수신
      ↓
OCI Object Storage 저장 (원본 보관)
      ↓
파싱 + 청킹 + 임베딩
      ↓
pgvector 저장 (벡터 + 메타데이터)
```

```python
import oci

object_storage = oci.object_storage.ObjectStorageClient(config)
object_storage.put_object(
    namespace_name=namespace,
    bucket_name="knowledge-files",
    object_name=file_hash,
    put_object_body=file_bytes
)
```

---

### 배포 방식: Docker Compose + Nginx

단일 VM에 Docker Compose로 전체 서비스를 구성한다.

```
OCI Ampere A1 VM
└── Docker Compose
    ├── nginx        (80, 443) ← 리버스 프록시 + SSL
    ├── frontend     (3000)    ← Next.js
    ├── backend      (8000)    ← FastAPI
    └── db           (5432)    ← PostgreSQL + pgvector
```

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    depends_on: [frontend, backend]

  db:
    image: pgvector/pgvector:pg16
    platform: linux/arm64
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: knowledge_db
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  backend:
    build:
      context: ./backend
      platforms: [linux/arm64]
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/knowledge_db
      OPENAI_API_KEY: ${OPENAI_API_KEY}

  frontend:
    build:
      context: ./frontend
      platforms: [linux/arm64]
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}

volumes:
  pgdata:
```

---

### 네트워크: OCI VCN Security List

OCI는 Security List(방화벽)를 명시적으로 열어줘야 한다.

| 포트 | 용도 | 허용 |
|------|------|------|
| 22 | SSH | 내 IP만 |
| 80 | HTTP | 0.0.0.0/0 |
| 443 | HTTPS | 0.0.0.0/0 |
| 5432 | PostgreSQL | ❌ 외부 차단 |
| 8000 | FastAPI | ❌ Nginx 통해서만 |

---

## 아키텍처 다이어그램

```
인터넷
   ↓ 80/443
OCI Ampere A1 VM
  └── Nginx (리버스 프록시)
        ├── / → Next.js (채팅 + 관리자 UI)
        └── /api → FastAPI (RAG API)
                      ↓
              PostgreSQL + pgvector
                      ↑
            OCI Object Storage (원본 파일)
```

---

## 결과

| 항목 | 선택 |
|------|------|
| 컴퓨트 | OCI Ampere A1 (4 OCPU, 24GB, ARM, 영구 무료) |
| 파일 스토리지 | OCI Object Storage (10GB, 영구 무료) |
| 배포 방식 | Docker Compose + Nginx |
| SSL | Let's Encrypt (Certbot) |
| 예상 월 비용 | **$0** (OCI Always Free) + LLM API ~$5~10 |

---

## 미결 사항

- [ ] 도메인 연결 방식 (OCI DNS vs 외부 도메인 레지스트라)
- [ ] SSL 인증서 자동 갱신 설정 (Certbot + cron)
- [ ] VM 장애 시 복구 전략 (DB 백업 주기)
- [ ] OCI Object Storage 버킷 접근 권한 설정 (IAM Policy)
