# TASK: MVP Frontend 구현

## 목표
Next.js 14로 채팅 UI와 지식 추가 UI를 구현한다.
백엔드 API와 연동하여 질문-답변, 지식 추가가 동작해야 한다.

## 작업 디렉토리
`/Users/colosseum_nohys/Documents/my/playground/domain-knowledge-chatbot/frontend`

## 기술 스펙
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- 상태관리: React 기본 useState (별도 라이브러리 없음)

## 디렉토리 구조
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              ← /  채팅 페이지로 redirect
│   ├── chat/
│   │   └── page.tsx          ← 채팅 UI
│   └── admin/
│       └── page.tsx          ← 지식 추가 UI
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx    ← 메시지 목록 표시
│   │   ├── MessageBubble.tsx ← 메시지 말풍선
│   │   └── ChatInput.tsx     ← 질문 입력창
│   └── admin/
│       └── KnowledgeForm.tsx ← 지식 추가 폼
├── lib/
│   └── api.ts                ← API 호출 함수
├── .env.local.example
├── Dockerfile
└── next.config.ts
```

## 화면 명세

### `/chat` — 채팅 페이지

**레이아웃**
- 상단: 네비게이션 (Chat / Admin 링크)
- 중앙: 메시지 목록 (스크롤)
- 하단: 질문 입력창 + 전송 버튼

**동작**
1. 질문 입력 후 전송
2. 내 메시지가 오른쪽 말풍선으로 표시
3. 로딩 스피너 표시
4. 답변이 왼쪽 말풍선으로 표시
5. 답변 아래 출처(sources) 접을 수 있는 섹션 표시

**API 연동**
```
POST {NEXT_PUBLIC_API_URL}/chat
Body: { "question": "..." }
Response: { "answer": "...", "sources": [...] }
```

### `/admin` — 지식 추가 페이지

**레이아웃**
- 상단: 네비게이션
- 중앙: 지식 추가 폼

**폼 필드**
- 제목 (필수, text input)
- 내용 (필수, textarea, 최소 높이 200px)
- 카테고리 (선택, select): policy / guide / error / process / faq

**동작**
1. 폼 입력 후 저장 버튼 클릭
2. 로딩 상태 표시
3. 성공 시 토스트 메시지 + 폼 초기화
4. 실패 시 에러 메시지 표시

**API 연동**
```
POST {NEXT_PUBLIC_API_URL}/knowledge
Body: { "title": "...", "content": "...", "category": "..." }
Response: { "id": 1, "title": "...", "message": "저장 완료" }
```

## lib/api.ts

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export async function sendChat(question: string) { ... }
export async function addKnowledge(data: KnowledgeInput) { ... }
```

## 환경변수 (`.env.local`에서 로딩)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## UI 스타일 가이드
- 전체 배경: 흰색 또는 연한 회색
- 채팅 말풍선: 사용자(파란색), 봇(회색)
- 심플하고 깔끔하게 (과도한 디자인 없음)
- 반응형 불필요 (데스크탑만)

## Dockerfile
- `node:20-alpine` 베이스
- standalone 빌드 (`output: 'standalone'` in next.config.ts)

## 완료 조건
- `npm run dev` 실행 시 `http://localhost:3000` 정상 접근
- `/chat`에서 질문 전송 시 답변 표시
- `/admin`에서 지식 추가 시 성공 메시지 표시
