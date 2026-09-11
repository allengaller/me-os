import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Gem, GitBranch, Radio, Package } from 'lucide-react';
import Overview from './brand/Overview';
import Profile from './brand/Profile';
import Pipeline from './brand/Pipeline';
import Channels from './brand/Channels';
import Works from './brand/Works';

type TabKey = 'overview' | 'profile' | 'pipeline' | 'channels' | 'works';

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: '总览', icon: LayoutDashboard },
  { key: 'profile', label: '品牌资产', icon: Gem },
  { key: 'pipeline', label: '内容流水线', icon: GitBranch },
  { key: 'channels', label: '渠道与数据', icon: Radio },
  { key: 'works', label: '作品库', icon: Package },
];

export default function BrandHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';
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
          品牌
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          定位、创作、分发与复盘——经营你唯一的品牌：你自己
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

      {activeTab === 'overview' && <Overview />}
      {activeTab === 'profile' && <Profile />}
      {activeTab === 'pipeline' && <Pipeline />}
      {activeTab === 'channels' && <Channels />}
      {activeTab === 'works' && <Works />}
    </div>
  );
}
