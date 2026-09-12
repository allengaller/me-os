import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target, Compass, Flag, GitBranch } from 'lucide-react';
import MethodologyCard from '../components/MethodologyCard';
import Vision from './direction/Vision';
import Domains from './direction/Domains';
import Goals from './direction/Goals';
import Workflow from './direction/Workflow';

type TabKey = 'vision' | 'domains' | 'goals' | 'workflow';

const TABS: { key: TabKey; label: string; icon: typeof Target }[] = [
  { key: 'vision', label: '愿景与价值观', icon: Target },
  { key: 'domains', label: '领域与平衡', icon: Compass },
  { key: 'goals', label: '目标与项目', icon: Flag },
  { key: 'workflow', label: '工作流', icon: GitBranch },
];

export default function DirectionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'vision';
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
          方向
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          愿景、领域与目标，定义你要去哪里
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

      <MethodologyCard page={`direction:${activeTab}`} />

      {activeTab === 'vision' && <Vision />}
      {activeTab === 'domains' && <Domains />}
      {activeTab === 'goals' && <Goals />}
      {activeTab === 'workflow' && <Workflow />}
    </div>
  );
}
