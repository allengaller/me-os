import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Users } from 'lucide-react';
import MethodologyCard from '../components/MethodologyCard';
import Assets from './resources/Assets';
import Contacts from './resources/Contacts';

type TabKey = 'assets' | 'contacts';

const TABS: { key: TabKey; label: string; icon: typeof Wallet }[] = [
  { key: 'assets', label: '资产管理', icon: Wallet },
  { key: 'contacts', label: '人脉', icon: Users },
];

export default function ResourcesHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'assets';
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
          资源
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          资产管理与人脉维护，你的外部支持系统
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

      {activeTab === 'contacts' && <MethodologyCard page="resources:contacts" />}

      {activeTab === 'assets' && <Assets />}
      {activeTab === 'contacts' && <Contacts />}
    </div>
  );
}
