# Installation 기록

로컬 개발 환경 설정 과정에서 발생한 이슈와 해결 방법.

---

## 환경

- OS: macOS (Apple Silicon, ARM)
- Python: 3.11.15 (brew)
- Node.js: 20 (brew)
- Docker: OrbStack

---

## 설치 순서

### 1. Ollama 설치

```bash
brew install ollama
brew services start ollama
```

모델 다운로드:
```bash
ollama pull bge-m3       # Embedding 모델 (~1.2GB)
ollama pull qwen2.5:7b   # LLM 모델 (~4.7GB)
```

### 2. DB 실행

```bash
docker-compose up -d db
```

> 포트 5432가 이미 사용 중(n8n-postgres)이어서 `5434`로 변경됨.

### 3. 백엔드 실행

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. 프론트엔드 실행

```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
```

---

## 트러블슈팅

### Python 3.14 호환성 문제
- **증상**: `brew install ollama` 시 Python 3.14가 함께 설치되면서 기본 python3가 3.14로 변경됨
- **원인**: LangChain이 내부적으로 Pydantic V1 호환 레이어를 사용하는데, Python 3.14 미지원
- **해결**: `brew install python@3.11` 후 venv를 `/opt/homebrew/bin/python3.11`으로 생성

### pydantic-settings extra fields 오류
- **증상**: `Extra inputs are not permitted` (POSTGRES_DB, POSTGRES_USER 등)
- **원인**: `.env`에 Settings 모델에 없는 변수가 있어서 기본값인 `extra = "forbid"` 에 걸림
- **해결**: `config.py`의 Settings에 `"extra": "ignore"` 추가

```python
model_config = {"env_file": ".env", "extra": "ignore"}
```

### DATABASE_URL 호스트명 문제
- **증상**: `could not translate host name "db" to address`
- **원인**: `.env`의 DATABASE_URL이 Docker 내부 hostname(`db`)을 사용 중인데, 로컬 실행 시 해당 hostname 미인식
- **해결**: 로컬용 backend/.env에서 `@db:5432` → `@localhost:5434`로 변경

> Docker 컨테이너 안에서 실행 시에는 `@db:5432` 그대로 사용.

### Ollama 연결 오류
- **증상**: `Failed to connect to Ollama... host.docker.internal`
- **원인**: `.env`의 OLLAMA_BASE_URL이 Docker 내부 주소(`host.docker.internal:11434`)로 설정됨
- **해결**: 로컬용 backend/.env에서 `host.docker.internal` → `localhost`로 변경

```
OLLAMA_BASE_URL=http://localhost:11434
```

> Docker 컨테이너 안에서 실행 시에는 `http://host.docker.internal:11434` 그대로 사용.

---

## 로컬 vs Docker 환경변수 차이

| 변수 | 로컬 실행 | Docker 실행 |
|------|----------|------------|
| `DATABASE_URL` | `@localhost:5434/...` | `@db:5432/...` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | `http://host.docker.internal:11434` |

---

## 동작 확인

```bash
# 지식 저장
curl -X POST http://localhost:8000/knowledge \
  -H "Content-Type: application/json" \
  -d '{"title":"휴가 정책","content":"연차는 연 15일입니다.","category":"policy"}'
# → {"id":"...","title":"휴가 정책","message":"저장 완료"}

# RAG 질문
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"휴가는 몇 일이야?"}'
# → {"answer":"연차는 15일입니다.","sources":[...]}
```

---

## 기록일
2026-04-03
