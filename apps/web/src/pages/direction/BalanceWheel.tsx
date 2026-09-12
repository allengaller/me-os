import { useEffect, useState } from 'react';
import api from '../../lib/api';
import RadarChart from '../../components/charts/RadarChart';

interface Domain {
  id: string;
  name: string;
  icon: string;
}

export default function BalanceWheel() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const response = await api.get('/domains');
      setDomains(response.data.domains);
      const initialScores: Record<string, number> = {};
      response.data.domains.forEach((d: Domain) => {
        initialScores[d.id] = 5;
      });
      setScores(initialScores);
    } catch (error) {
      console.error('加载领域失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const scoreData = Object.entries(scores).map(([domainId, score]) => ({
        domainId,
        score,
      }));
      await api.post('/balance-wheel/scores', { scores: scoreData });
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = domains.map((domain) => ({
    domain: domain.name,
    score: scores[domain.id] || 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-slate-900 tracking-tight">生活平衡轮</h1>
        <p className="text-sm text-slate-400 mt-1">为各个生活领域打分（1-10分），可视化你的生活平衡状态</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-6">
          <h2 className="text-sm font-medium text-slate-900 mb-4">平衡轮可视化</h2>
          <RadarChart data={chartData.map((d) => ({ label: d.domain, value: d.score }))} max={10} color="#0ea5e9" gridColor="#e2e8f0" labelColor="#64748b" />
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-6">
          <h2 className="text-sm font-medium text-slate-900 mb-4">领域评分</h2>
          <div className="space-y-5">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-28">
                  <span className="text-xl">{domain.icon}</span>
                  <span className="text-sm font-medium text-slate-700 truncate">{domain.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scores[domain.id] || 5}
                    onChange={(e) => setScores({ ...scores, [domain.id]: parseInt(e.target.value) })}
                    className="flex-1 h-1 bg-slate-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-ink-soft)]"
                  />
                  <span className="text-lg font-light text-slate-900 w-6 text-center tabular-nums">
                    {scores[domain.id] || 5}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full py-3 text-sm font-medium text-white bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] rounded-lg transition-all disabled:opacity-50"
          >
            {submitting ? '保存中...' : '保存评分'}
          </button>
        </div>
      </div>
    </div>
  );
}
