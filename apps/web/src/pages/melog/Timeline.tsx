import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, Radio } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { CATEGORY_META, MELOG_CATEGORY_LIST, formatTime, type MeLogCategory } from './meta';

interface MeLogEntry {
  id: string;
  category: string;
  type: string;
  title: string;
  content?: string;
  tags?: string;
  actor?: string;
  occurredAt: string;
  source?: { name: string; adapter: string; category: string };
}

interface Overview {
  totalEntries: number;
  last7Days: number;
  last30Days: number;
  byCategory: { category: string; count: number; last7Days: number }[];
  sources: { total: number; connected: number; error: number }[];
}

export default function Timeline() {
  const [entries, setEntries] = useState<MeLogEntry[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<MeLogCategory | ''>('');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (query) params.set('q', query);
      params.set('limit', '100');
      const [entriesRes, overviewRes] = await Promise.all([
        api.get(`/melog/entries?${params.toString()}`),
        api.get('/melog/overview'),
      ]);
      setEntries(entriesRes.data.entries || []);
      setOverview(overviewRes.data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [category, query]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(keyword.trim());
  };

  const stats = [
    { label: '累计条目', value: overview?.totalEntries ?? 0 },
    { label: '近 7 天', value: overview?.last7Days ?? 0 },
    { label: '近 30 天', value: overview?.last30Days ?? 0 },
    {
      label: '数据源',
      value: `${overview?.sources[0]?.connected ?? 0}/${overview?.sources[0]?.total ?? 0}`,
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
          >
            <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {stat.label}
            </div>
            <div className="text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 text-xs rounded-full transition-all ${
            category === '' ? 'font-medium text-white' : ''
          }`}
          style={
            category === ''
              ? { backgroundColor: 'var(--color-text-primary)' }
              : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-tertiary)' }
          }
        >
          全部
        </button>
        {MELOG_CATEGORY_LIST.map((key) => {
          const meta = CATEGORY_META[key];
          const count = overview?.byCategory.find((c) => c.category === key)?.count ?? 0;
          return (
            <button
              key={key}
              onClick={() => setCategory(category === key ? '' : key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all"
              style={
                category === key
                  ? { backgroundColor: meta.color, color: '#fff', fontWeight: 500 }
                  : { backgroundColor: meta.bg, color: meta.color }
              }
            >
              <meta.icon size={12} />
              {meta.label}
              <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}

        <form onSubmit={handleSearch} className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索标题、内容、参与者"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg w-52 outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: 'var(--color-text-tertiary)' }}
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
        </form>
      </div>

      {/* 时间线 */}
      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Radio size={24} strokeWidth={1} />}
          title="时间线还是空的"
          description="在「数据源」标签页接入连接器，或按 MeLog Standard 通过 POST /api/melog/ingest 推送第一批条目"
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const meta = CATEGORY_META[(entry.category as MeLogCategory) || 'custom'] || CATEGORY_META.custom;
            return (
              <div
                key={entry.id}
                className="flex gap-3 rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  <meta.icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {entry.title}
                    </span>
                    <span
                      className="px-1.5 py-0.5 text-[10px] rounded"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {meta.label} · {entry.type}
                    </span>
                    {entry.source && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {entry.source.name}
                      </span>
                    )}
                  </div>
                  {entry.content && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {entry.actor && <span className="font-medium">{entry.actor}：</span>}
                      {entry.content}
                    </p>
                  )}
                  <div className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatTime(entry.occurredAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
