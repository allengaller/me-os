import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Plug, Sparkles, FileBadge } from 'lucide-react';
import Timeline from './melog/Timeline';
import Sources from './melog/Sources';
import Skills from './melog/Skills';
import Standard from './melog/Standard';

type TabKey = 'timeline' | 'sources' | 'skills' | 'standard';

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: 'timeline', label: '时间线', icon: Activity },
  { key: 'sources', label: '数据源', icon: Plug },
  { key: 'skills', label: '技能', icon: Sparkles },
  { key: 'standard', label: '标准', icon: FileBadge },
];

export default function MeLogHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'timeline';
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
          MeLog
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          把健康、笔记、聊天记录汇入一条本地时间线，用技能生成洞察
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

      {activeTab === 'timeline' && <Timeline />}
      {activeTab === 'sources' && <Sources />}
      {activeTab === 'skills' && <Skills />}
      {activeTab === 'standard' && <Standard />}
    </div>
  );
}
