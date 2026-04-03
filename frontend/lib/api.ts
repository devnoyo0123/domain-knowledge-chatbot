const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface Source {
  title: string;
  content: string;
  category?: string;
  score?: number;
}

export interface KnowledgeInput {
  title: string;
  content: string;
  category: string;
}

export interface KnowledgeResponse {
  id: number;
  title: string;
  message: string;
}

export async function sendChat(question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }
  return res.json();
}

export async function addKnowledge(data: KnowledgeInput): Promise<KnowledgeResponse> {
  const res = await fetch(`${API_URL}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Knowledge API error: ${res.status}`);
  }
  return res.json();
}
