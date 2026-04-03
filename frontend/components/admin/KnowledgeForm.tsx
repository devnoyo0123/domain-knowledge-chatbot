'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addKnowledge, type KnowledgeInput } from '@/lib/api';

const CATEGORIES = [
  { value: 'policy', label: '정책 (Policy)' },
  { value: 'guide', label: '가이드 (Guide)' },
  { value: 'error', label: '에러 (Error)' },
  { value: 'process', label: '프로세스 (Process)' },
  { value: 'faq', label: 'FAQ' },
] as const;

const EMPTY_FORM: KnowledgeInput = { title: '', content: '', category: 'guide' };

export function KnowledgeForm() {
  const [form, setForm] = useState<KnowledgeInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const setField = <K extends keyof KnowledgeInput>(key: K, val: KnowledgeInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setErrorMsg('제목과 내용은 필수입니다.');
      return;
    }
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await addKnowledge(form);
      setSuccessMsg(res.message ?? '지식이 성공적으로 저장되었습니다.');
      setForm(EMPTY_FORM);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          제목 <span className="text-red-500">*</span>
        </label>
        <Input
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="지식 제목을 입력하세요"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          내용 <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={form.content}
          onChange={(e) => setField('content', e.target.value)}
          placeholder="지식 내용을 입력하세요"
          disabled={loading}
          className="min-h-[200px] resize-y"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">카테고리</label>
        <Select
          value={form.category}
          onValueChange={(val) => val && setField('category', val)}
          disabled={loading}
        >
          <SelectTrigger className="w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {successMsg && (
        <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          ✓ {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          ✗ {errorMsg}
        </p>
      )}

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? '저장 중...' : '저장'}
      </Button>
    </div>
  );
}
