import Link from 'next/link';
import { KnowledgeForm } from '@/components/admin/KnowledgeForm';

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-gray-900">Knowledge Chatbot</span>
        <div className="flex gap-4 text-sm">
          <Link href="/chat" className="text-gray-500 hover:text-gray-800 transition-colors">
            Chat
          </Link>
          <span className="font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5">
            Admin
          </span>
        </div>
      </nav>

      <main className="flex-1 px-8 py-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">지식 추가</h1>
        <KnowledgeForm />
      </main>
    </div>
  );
}
