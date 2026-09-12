import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sun, CalendarDays } from 'lucide-react';
import MethodologyCard from '../components/MethodologyCard';
import Daily from './reflection/Daily';
import Review from './reflection/Review';

type TabKey = 'daily' | 'periodic';

const TABS: { key: TabKey; label: string; icon: typeof Sun }[] = [
  { key: 'daily', label: '每日反思', icon: Sun },
  { key: 'periodic', label: '周期复盘', icon: CalendarDays },
];

export default function ReflectionHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'daily';
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
          反思
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          每日反思与周期复盘，萃取经验智慧
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

      <MethodologyCard page={`reflection:${activeTab}`} />

      {activeTab === 'daily' ? <Daily /> : <Review />}
    </div>
  );
}
