import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, TerminalSquare, X } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import {
  ADAPTER_PRESETS,
  CATEGORY_META,
  MELOG_CATEGORY_LIST,
  SOURCE_STATUS_META,
  formatTime,
  type MeLogCategory,
} from './meta';

interface MeLogSource {
  id: string;
  name: string;
  category: string;
  adapter: string;
  endpoint?: string;
  status: string;
  lastSyncAt?: string;
  entryCount: number;
  isActive: boolean;
}

export default function Sources() {
  const [sources, setSources] = useState<MeLogSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{ name: string; category: MeLogCategory; adapter: string; endpoint: string }>({
    name: '',
    category: 'im',
    adapter: 'chatlog',
    endpoint: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/melog/sources');
      setSources(res.data.sources || []);
    } catch {
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdapterChange = (adapter: string) => {
    const preset = ADAPTER_PRESETS.find((p) => p.adapter === adapter);
    setForm((prev) => ({
      ...prev,
      adapter,
      category: preset?.category || prev.category,
      name: prev.name || preset?.name || '',
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/melog/sources', {
        name: form.name.trim(),
        category: form.category,
        adapter: form.adapter,
        endpoint: form.endpoint.trim() || undefined,
      });
      setForm({ name: '', category: 'im', adapter: 'chatlog', endpoint: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      const message =
        err instanceof Error && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? '创建失败')
          : '创建失败';
      setError(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('删除数据源会同时删除其全部条目，确定继续吗？')) return;
    try {
      await api.delete(`/melog/sources/${id}`);
      loadData();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          连接器按 MeLog Standard 把外部数据推送到统一时间线；MeOS 本地存储，不做云端转发
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-text-primary)' }}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? '取消' : '接入数据源'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
        >
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                连接器类型
              </span>
              <select
                value={form.adapter}
                onChange={(e) => handleAdapterChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {ADAPTER_PRESETS.map((preset) => (
                  <option key={preset.adapter} value={preset.adapter}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] block mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {ADAPTER_PRESETS.find((p) => p.adapter === form.adapter)?.description}
              </span>
            </label>

            <label className="block">
              <span className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                显示名称
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="如：微信聊天记录"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </label>

            <label className="block">
              <span className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                分类
              </span>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as MeLogCategory }))}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {MELOG_CATEGORY_LIST.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_META[category].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                连接器地址（可选，仅作登记）
              </span>
              <input
                value={form.endpoint}
                onChange={(e) => setForm((prev) => ({ ...prev, endpoint: e.target.value }))}
                placeholder="http://localhost:5030"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}

          <button
            type="submit"
            className="px-4 py-2 text-xs rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-text-primary)' }}
          >
            创建数据源
          </button>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : sources.length === 0 ? (
        <EmptyState
          icon={<TerminalSquare size={24} strokeWidth={1} />}
          title="还没有接入任何数据源"
          description="从「微信聊天记录 + 健康导出」开始，跑通第一条数据到时间线的链路"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-xs rounded-lg text-white"
              style={{ backgroundColor: 'var(--color-text-primary)' }}
            >
              接入第一个数据源
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {sources.map((source) => {
            const status = SOURCE_STATUS_META[source.status] || SOURCE_STATUS_META.disconnected;
            const meta = CATEGORY_META[(source.category as MeLogCategory) || 'custom'] || CATEGORY_META.custom;
            return (
              <div
                key={source.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {source.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {source.adapter}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
                    title="删除数据源"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-xs space-y-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  <div>
                    {meta.label} · {status.label} · {source.entryCount} 条
                  </div>
                  <div>最近同步：{formatTime(source.lastSyncAt)}</div>
                  {source.endpoint && <div className="truncate">地址：{source.endpoint}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 接入提示 */}
      <div
        className="rounded-xl p-4 mt-6"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px dashed var(--color-border-light)' }}
      >
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          连接器如何推送数据（MeLog Standard Ingest API）
        </div>
        <pre
          className="text-[11px] overflow-x-auto whitespace-pre-wrap"
          style={{ color: 'var(--color-text-tertiary)' }}
        >{`curl -X POST http://localhost:3001/api/melog/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": { "adapter": "chatlog", "name": "微信聊天记录", "category": "im" },
    "entries": [{
      "externalId": "msg-001",
      "category": "im",
      "type": "chat-message",
      "title": "与妈妈的对话",
      "content": "周末回家吃饭",
      "actor": "妈妈",
      "occurredAt": "2026-09-04T10:00:00Z"
    }]
  }'`}</pre>
      </div>
    </div>
  );
}
