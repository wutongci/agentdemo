import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { WorkflowPage } from './components/WorkflowPage';
import { SkillsPage } from './components/skills';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState<'simple' | 'workflow' | 'skills'>('workflow');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col">
        {/* 顶部导航 */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">AI 写作助手</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentPage('workflow')}
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === 'workflow'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              🤝 协作工作流
            </button>
            <button
              onClick={() => setCurrentPage('simple')}
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === 'simple'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              💬 简单对话
            </button>
            <button
              onClick={() => setCurrentPage('skills')}
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === 'skills'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              ⚡ Skills
            </button>
          </nav>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 overflow-hidden">
          {currentPage === 'workflow' && <WorkflowPage />}
          {currentPage === 'simple' && <Layout />}
          {currentPage === 'skills' && <SkillsPage />}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
