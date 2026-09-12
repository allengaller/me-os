import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Dumbbell } from 'lucide-react';
import MethodologyCard from '../components/MethodologyCard';
import Todos from './action/Todos';
import Habits from './action/Habits';

type TabKey = 'todos' | 'habits';

const TABS: { key: TabKey; label: string; icon: typeof CheckCircle2 }[] = [
  { key: 'todos', label: '待办', icon: CheckCircle2 },
  { key: 'habits', label: '习惯', icon: Dumbbell },
];

export default function ActionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'todos';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1
          className="text-3xl mb-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
          }}
        >
          行动
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          待办事项与习惯追踪，把意图变成结果
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === tab.key ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--color-surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <MethodologyCard page={`action:${activeTab}`} />

      {activeTab === 'todos' && <Todos />}
      {activeTab === 'habits' && <Habits />}
    </div>
  );
}
