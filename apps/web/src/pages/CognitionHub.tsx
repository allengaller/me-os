import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StickyNote, BookOpen, BrainCircuit, Lightbulb } from 'lucide-react';
import MethodologyCard from '../components/MethodologyCard';
import Notes from './cognition/Notes';
import Reading from './cognition/Reading';
import Topics from './cognition/Topics';
import Insights from './cognition/Insights';

type TabKey = 'notes' | 'reading' | 'topics' | 'insights';

const TABS: { key: TabKey; label: string; icon: typeof StickyNote }[] = [
  { key: 'notes', label: '笔记', icon: StickyNote },
  { key: 'reading', label: '阅读', icon: BookOpen },
  { key: 'topics', label: '课题', icon: BrainCircuit },
  { key: 'insights', label: '洞察', icon: Lightbulb },
];

export default function CognitionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'notes';
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
          认知
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          笔记、阅读、课题与洞察，构建你的第二大脑
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

      <MethodologyCard page={`cognition:${activeTab}`} />

      {activeTab === 'notes' && <Notes />}
      {activeTab === 'reading' && <Reading />}
      {activeTab === 'topics' && <Topics />}
      {activeTab === 'insights' && <Insights />}
    </div>
  );
}
