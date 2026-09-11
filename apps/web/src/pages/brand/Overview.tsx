import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import type { BrandOverview, ContentStatus } from '@meos/shared';

const FUNNEL: { key: ContentStatus; label: string }[] = [
  { key: 'idea', label: '选题' },
  { key: 'drafting', label: '创作中' },
  { key: 'ready', label: '待发布' },
  { key: 'published', label: '已发布' },
];

const CHANNEL_STATUS_COLORS: Record<string, string> = { active: '#10b981', paused: '#f59e0b', dormant: '#94a3b8' };
const LINE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Overview() {
  const [data, setData] = useState<BrandOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/brand/overview');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  if (!data) return <EmptyState title="加载失败" description="无法获取品牌总览，请确认后端已启动" />;

  const maxLength = Math.max(0, ...data.trends.map((t) => t.series.length));
  const chartData = Array.from({ length: maxLength }, (_, i) => {
    const row: Record<string, string | number> = { point: `#${i + 1}` };
    for (const t of data.trends) {
      if (t.series[i]) row[t.name] = t.series[i].followers;
    }
    return row;
  });

  return (
    <div className="page-enter space-y-6">
      <div className="card p-6">
        {data.profile?.slogan ? (
          <>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              {data.profile.slogan}
            </h2>
            {data.profile.mission && (
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {data.profile.mission}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            title="还没有品牌定位"
            description="先到「品牌资产」写下定位宣言和 slogan，让所有输出对齐"
            action={
              <Link to="/brand?tab=profile" className="btn btn-primary text-sm">
                去完善品牌资产
              </Link>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '本周发布', value: data.publishedThisWeek },
          { label: '本月发布', value: data.publishedThisMonth },
          {
            label: '选题池',
            value: (data.pipeline.idea || 0) + (data.pipeline.drafting || 0) + (data.pipeline.ready || 0),
          },
          { label: '活跃渠道', value: data.channels.filter((c) => c.status === 'active').length },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {card.label}
            </p>
            <p className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">内容漏斗</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FUNNEL.map((f) => (
            <div key={f.key} className="card p-4">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {f.label}
              </p>
              <p className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                {data.pipeline[f.key] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {data.channels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">渠道健康</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.channels.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${CHANNEL_STATUS_COLORS[c.status]}22`, color: CHANNEL_STATUS_COLORS[c.status] }}
                  >
                    {c.status}
                  </span>
                </div>
                {c.latest ? (
                  <p className="text-2xl" style={{ color: 'var(--color-text-primary)' }}>
                    {c.latest.followers}
                    <span className="text-xs ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      粉丝
                    </span>
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    暂无数据，去录入快照
                  </p>
                )}
                {c.followerDelta !== null && (
                  <p className="text-xs mt-1" style={{ color: c.followerDelta >= 0 ? '#10b981' : '#ef4444' }}>
                    {c.followerDelta >= 0 ? '+' : ''}
                    {c.followerDelta} 较上次
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div>
          <h3 className="text-sm font-medium mb-3">粉丝趋势</h3>
          <div className="card p-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="point" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {data.trends.map((t, i) => (
                  <Line
                    key={t.channelId}
                    type="monotone"
                    dataKey={t.name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.pillars.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">内容支柱覆盖</h3>
          <div className="flex flex-wrap gap-2">
            {data.pillars.map((p) => (
              <div key={p.id} className="card px-3 py-2 text-xs">
                {p.name} · {p.contentCount} 篇
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
