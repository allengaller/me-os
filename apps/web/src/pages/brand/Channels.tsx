import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import EmptyState from '../../components/EmptyState';
import { CHANNEL_STATUS_LABELS, PLATFORM_PRESETS } from './constants';
import type { MetricSnapshot, PlatformChannel } from '@meos/shared';

const emptyChannelForm = { platform: 'custom', name: '', handle: '', cadence: '', positioning: '' };
const emptySnapshotForm = { followers: '', views: '', likes: '', comments: '', shares: '', revenue: '', note: '' };

export default function Channels() {
  const [channels, setChannels] = useState<PlatformChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [channelForm, setChannelForm] = useState(emptyChannelForm);
  const [snapshotFor, setSnapshotFor] = useState<PlatformChannel | null>(null);
  const [snapshotForm, setSnapshotForm] = useState(emptySnapshotForm);
  const [trendFor, setTrendFor] = useState<PlatformChannel | null>(null);
  const [trendSnapshots, setTrendSnapshots] = useState<MetricSnapshot[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/brand/channels');
      setChannels(res.data.channels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddChannel = async () => {
    if (!channelForm.name.trim()) return;
    try {
      await api.post('/brand/channels', {
        platform: channelForm.platform,
        name: channelForm.name.trim(),
        handle: channelForm.handle || null,
        cadence: channelForm.cadence || null,
        positioning: channelForm.positioning || null,
      });
      setAdding(false);
      setChannelForm(emptyChannelForm);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const openSnapshot = (channel: PlatformChannel) => {
    setSnapshotFor(channel);
    setSnapshotForm(emptySnapshotForm);
  };

  const handleSaveSnapshot = async () => {
    if (!snapshotFor || snapshotForm.followers === '') return;
    try {
      await api.post('/brand/snapshots', {
        channelId: snapshotFor.id,
        followers: parseInt(snapshotForm.followers, 10),
        views: snapshotForm.views === '' ? null : parseInt(snapshotForm.views, 10),
        likes: snapshotForm.likes === '' ? null : parseInt(snapshotForm.likes, 10),
        comments: snapshotForm.comments === '' ? null : parseInt(snapshotForm.comments, 10),
        shares: snapshotForm.shares === '' ? null : parseInt(snapshotForm.shares, 10),
        revenue: snapshotForm.revenue === '' ? null : parseFloat(snapshotForm.revenue),
        note: snapshotForm.note || null,
      });
      setSnapshotFor(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const openTrend = async (channel: PlatformChannel) => {
    try {
      const res = await api.get(`/brand/snapshots?channelId=${channel.id}&limit=30`);
      setTrendSnapshots(res.data.snapshots || []);
      setTrendFor(channel);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await api.delete(`/brand/channels/${id}`);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (channel: PlatformChannel) => {
    try {
      const next = channel.status === 'active' ? 'paused' : 'active';
      await api.patch(`/brand/channels/${channel.id}`, { status: next });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
      </div>
    );
  }

  const trendData = [...trendSnapshots].reverse().map((s) => ({
    date: new Date(s.recordedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    followers: s.followers,
  }));

  return (
    <div className="page-enter">
      <div className="flex justify-end mb-4">
        <button onClick={() => setAdding(true)} className="btn btn-primary text-sm">
          <Plus size={14} /> 添加渠道
        </button>
      </div>

      {channels.length === 0 ? (
        <EmptyState
          title="还没有平台渠道"
          description="添加公众号、小红书、X、YouTube 等账号，开始追踪"
          action={
            <button onClick={() => setAdding(true)} className="btn btn-primary text-sm">
              添加渠道
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {channel.name}
                  </p>
                  {channel.handle && (
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      @{channel.handle}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      channel.status === 'active' ? '#d1fae5' : channel.status === 'paused' ? '#fef3c7' : '#f1f5f9',
                    color: channel.status === 'active' ? '#065f46' : channel.status === 'paused' ? '#92400e' : '#64748b',
                  }}
                >
                  {CHANNEL_STATUS_LABELS[channel.status]}
                </span>
              </div>
              {channel.cadence && (
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  节奏：{channel.cadence}
                </p>
              )}
              {channel.positioning && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  {channel.positioning}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => openSnapshot(channel)} className="btn btn-primary text-xs px-2 py-1">
                  <Plus size={12} /> 录入快照
                </button>
                <button onClick={() => openTrend(channel)} className="btn text-xs px-2 py-1">
                  <LineChartIcon size={12} /> 趋势
                </button>
                <button onClick={() => toggleStatus(channel)} className="btn text-xs px-2 py-1">
                  {channel.status === 'active' ? '暂停' : '恢复'}
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="text-slate-400 hover:text-red-500 ml-auto"
                  aria-label={`删除渠道 ${channel.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="添加渠道">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">选择平台</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setChannelForm((f) => ({ ...f, platform: preset.key, name: preset.name }))}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: channelForm.platform === preset.key ? 'var(--color-text-primary)' : 'var(--color-bg-secondary)',
                    color: channelForm.platform === preset.key ? '#fff' : 'var(--color-text-primary)',
                  }}
                >
                  {preset.name}
                </button>
              ))}
              <button
                onClick={() => setChannelForm((f) => ({ ...f, platform: 'custom', name: '' }))}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: channelForm.platform === 'custom' ? 'var(--color-text-primary)' : 'var(--color-bg-secondary)',
                  color: channelForm.platform === 'custom' ? '#fff' : 'var(--color-text-primary)',
                }}
              >
                自定义
              </button>
            </div>
          </div>
          <FormField label="显示名" required>
            <input
              type="text"
              value={channelForm.name}
              onChange={(e) => setChannelForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="如：公众号主号"
              className="input"
            />
          </FormField>
          <FormField label="账号 / Handle">
            <input
              type="text"
              value={channelForm.handle}
              onChange={(e) => setChannelForm((f) => ({ ...f, handle: e.target.value }))}
              className="input"
            />
          </FormField>
          <FormField label="更新节奏">
            <input
              type="text"
              value={channelForm.cadence}
              onChange={(e) => setChannelForm((f) => ({ ...f, cadence: e.target.value }))}
              placeholder="如：每周 2 篇"
              className="input"
            />
          </FormField>
          <FormField label="平台差异化定位">
            <textarea
              value={channelForm.positioning}
              onChange={(e) => setChannelForm((f) => ({ ...f, positioning: e.target.value }))}
              rows={2}
              placeholder="这个平台主打什么内容、什么人群"
              className="input resize-none"
            />
          </FormField>
          <div className="flex justify-end">
            <button onClick={handleAddChannel} disabled={!channelForm.name.trim()} className="btn btn-primary text-sm">
              添加
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!snapshotFor} onClose={() => setSnapshotFor(null)} title={`录入快照 · ${snapshotFor?.name || ''}`}>
        <div className="space-y-3">
          <FormField label="粉丝数（当前累计）" required>
            <input
              type="number"
              value={snapshotForm.followers}
              onChange={(e) => setSnapshotForm((f) => ({ ...f, followers: e.target.value }))}
              className="input"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="阅读/播放（本周期）">
              <input
                type="number"
                value={snapshotForm.views}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, views: e.target.value }))}
                className="input"
              />
            </FormField>
            <FormField label="点赞（本周期）">
              <input
                type="number"
                value={snapshotForm.likes}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, likes: e.target.value }))}
                className="input"
              />
            </FormField>
            <FormField label="评论（本周期）">
              <input
                type="number"
                value={snapshotForm.comments}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, comments: e.target.value }))}
                className="input"
              />
            </FormField>
            <FormField label="转发/分享（本周期）">
              <input
                type="number"
                value={snapshotForm.shares}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, shares: e.target.value }))}
                className="input"
              />
            </FormField>
            <FormField label="收入（本周期）">
              <input
                type="number"
                value={snapshotForm.revenue}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, revenue: e.target.value }))}
                className="input"
              />
            </FormField>
            <FormField label="备注">
              <input
                type="text"
                value={snapshotForm.note}
                onChange={(e) => setSnapshotForm((f) => ({ ...f, note: e.target.value }))}
                className="input"
              />
            </FormField>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            增量字段填「自上次快照以来」的数值；建议固定周期（如每周日）录入。
          </p>
          <div className="flex justify-end">
            <button onClick={handleSaveSnapshot} disabled={snapshotForm.followers === ''} className="btn btn-primary text-sm">
              保存快照
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!trendFor} onClose={() => setTrendFor(null)} title={`粉丝趋势 · ${trendFor?.name || ''}`}>
        {trendData.length < 2 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            至少需要两次快照才能看趋势
          </p>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Modal>
    </div>
  );
}
