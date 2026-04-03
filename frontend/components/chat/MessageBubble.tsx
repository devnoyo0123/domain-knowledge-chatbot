'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Source } from '@/lib/api';

interface MessageBubbleProps {
  role: 'user' | 'bot';
  content: string;
  sources?: Source[];
}

export function MessageBubble({ role, content, sources }: MessageBubbleProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const isUser = role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {content}
      </div>

      {!isUser && sources && sources.length > 0 && (
        <div className="max-w-[70%] w-full">
          <button
            onClick={() => setSourcesOpen((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
          >
            {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            출처 {sources.length}건
          </button>

          {sourcesOpen && (
            <div className="mt-1 space-y-1.5">
              {sources.map((src, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-700">{src.title}</span>
                    {src.category && (
                      <Badge variant="secondary" className="text-xs h-4 px-1.5">
                        {src.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-3">{src.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
