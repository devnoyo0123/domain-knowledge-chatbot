'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { Source } from '@/lib/api';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  sources?: Source[];
}

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

export function ChatWindow({ messages, loading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && !loading && (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          질문을 입력해 대화를 시작하세요.
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          sources={msg.sources}
        />
      ))}

      {loading && (
        <div className="flex items-start gap-2">
          <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
