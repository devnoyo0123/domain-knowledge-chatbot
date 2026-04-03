'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatWindow, type Message } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendChat } from '@/lib/api';

let idCounter = 0;
const nextId = () => String(++idCounter);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (question: string) => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: question },
    ]);
    setLoading(true);

    try {
      const res = await sendChat(question);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'bot', content: res.answer, sources: res.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'bot', content: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <nav className="border-b border-gray-200 px-6 py-3 flex items-center gap-6 shrink-0">
        <span className="font-semibold text-gray-900">Knowledge Chatbot</span>
        <div className="flex gap-4 text-sm">
          <span className="font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5">Chat</span>
          <Link href="/admin" className="text-gray-500 hover:text-gray-800 transition-colors">
            Admin
          </Link>
        </div>
      </nav>

      <ChatWindow messages={messages} loading={loading} />

      <div className="border-t border-gray-200 px-4 py-3 shrink-0">
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
