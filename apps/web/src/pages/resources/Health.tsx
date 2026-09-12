import { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import { Plus, Activity, Trash2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';
import LineChart from '../../components/charts/LineChart';

type HealthType = 'sleep' | 'exercise' | 'weight' | 'mood' | 'energy' | 'water';

interface HealthRecord {
  id: string;
  type: HealthType;
  value: number;
  unit: string;
  note?: string;
  date: string;
  createdAt: string;
}

interface HealthSummary {
  avg: number;
  count: number;
  latest: number;
}

const TYPE_LABELS: Record<HealthType, string> = {
  sleep: '睡眠',
  exercise: '运动',
  weight: '体重',
  mood: '心情',
  energy: '精力',
  water: '饮水',
};

const TYPE_UNITS: Record<HealthType, string> = {
  sleep: 'hours',
  exercise: 'minutes',
  weight: 'kg',
  mood: 'score',
  energy: 'score',
  water: 'ml',
};

const TYPE_COLORS: Record<HealthType, string> = {
  sleep: '#818cf8',
  exercise: '#34d399',
  weight: '#fbbf24',
  mood: '#f472b6',
  energy: '#fb923c',
  water: '#38bdf8',
};

const TYPES: HealthType[] = ['sleep', 'exercise', 'weight', 'mood', 'energy', 'water'];

export default function Health() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<HealthType>('sleep');
  const [addValue, setAddValue] = useState('');
  const [addNote, setAddNote] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const to = format(new Date(), 'yyyy-MM-dd');
      const from = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      const [recordsRes, summaryRes] = await Promise.all([
        api.get(`/health?type=${activeType}&from=${from}&to=${to}`),
        api.get(`/health/summary?days=7`),
      ]);
      setRecords(recordsRes.data.records || recordsRes.data?.data || recordsRes.data || []);
      setSummary(summaryRes.data.summary || summaryRes.data || null);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    const value = parseFloat(addValue);
    if (isNaN(value)) return;
    try {
      await api.post('/health', {
        type: activeType,
        value,
        unit: TYPE_UNITS[activeType],
        note: addNote || undefined,
      });
      setAddValue('');
      setAddNote('');
      loadData();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    try {
      await api.delete(`/health/${id}`);
      loadData();
    } catch {}
  };

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const day = format(new Date(r.date), 'MM-dd');
      map.set(day, r.value);
    });
    const result: { date: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = format(subDays(new Date(), i), 'MM-dd');
      result.push({ date: day, value: map.get(day) || 0 });
    }
    return result;
  }, [records]);

  if (loading && records.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-light text-slate-900 tracking-tight">健康记录</h1>
            <p className="text-sm text-slate-400 mt-1">追踪睡眠、运动、体重等健康数据</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-50 rounded-lg p-1 flex-wrap">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              activeType === type
                ? 'bg-[var(--color-surface)] text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-5 mb-6">
        <div className="flex gap-3">
          <input
            type="number"
            step="any"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder={`输入${TYPE_LABELS[activeType]}值 (${TYPE_UNITS[activeType]})`}
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="text"
            value={addNote}
            onChange={(e) => setAddNote(e.target.value)}
            placeholder="备注 (可选)"
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] text-white text-sm font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-5">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">平均值</p>
            <p className="text-2xl font-light text-slate-900">
              {summary.avg ? summary.avg.toFixed(1) : '-'}
              <span className="text-sm text-slate-400 ml-1">{TYPE_UNITS[activeType]}</span>
            </p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-5">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">记录数</p>
            <p className="text-2xl font-light text-slate-900">{summary.count || 0}</p>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-5">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">最新值</p>
            <p className="text-2xl font-light text-slate-900">
              {summary.latest ? summary.latest.toFixed(1) : '-'}
              <span className="text-sm text-slate-400 ml-1">{TYPE_UNITS[activeType]}</span>
            </p>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-5 mb-6">
        <p className="text-sm text-slate-500 mb-4">近14天趋势</p>
        {chartData.some((d) => d.value > 0) ? (
          <LineChart
            data={chartData}
            xKey="date"
            series={[{ key: 'value', color: TYPE_COLORS[activeType] }]}
            height={200}
          />
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-slate-400">暂无数据</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {records.map((record) => (
          <div
            key={record.id}
            className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-4 flex items-center justify-between group hover:border-slate-200 transition-all"
          >
            <div className="flex items-center gap-4">
              <Activity className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-sm text-slate-900">
                  {record.value} <span className="text-slate-400">{record.unit}</span>
                </p>
                {record.note && <p className="text-xs text-slate-400 mt-0.5">{record.note}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{format(new Date(record.date), 'yyyy-MM-dd')}</span>
              <button
                onClick={() => handleDelete(record.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">暂无记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
