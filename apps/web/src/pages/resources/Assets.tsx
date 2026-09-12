import { useState } from 'react';
import MethodologyCard from '../../components/MethodologyCard';
import Subscriptions from './Subscriptions';
import DevEnvironment from './DevEnvironment';

export default function Assets() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'devtools'>('subscriptions');

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
          资产管理
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          管理数字订阅与开发工具
        </p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 text-sm rounded-lg transition-all ${activeTab === 'subscriptions' ? 'font-medium' : ''}`}
          style={{
            backgroundColor: activeTab === 'subscriptions' ? 'var(--color-surface)' : 'transparent',
            color: activeTab === 'subscriptions' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            boxShadow: activeTab === 'subscriptions' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          订阅管理
        </button>
        <button
          onClick={() => setActiveTab('devtools')}
          className={`px-4 py-2 text-sm rounded-lg transition-all ${activeTab === 'devtools' ? 'font-medium' : ''}`}
          style={{
            backgroundColor: activeTab === 'devtools' ? 'var(--color-surface)' : 'transparent',
            color: activeTab === 'devtools' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            boxShadow: activeTab === 'devtools' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          开发环境
        </button>
      </div>

      <MethodologyCard page={`resources:${activeTab}`} />

      {activeTab === 'subscriptions' ? <Subscriptions /> : <DevEnvironment />}
    </div>
  );
}
