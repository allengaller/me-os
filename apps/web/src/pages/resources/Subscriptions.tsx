import { useEffect, useState, useRef } from 'react';
import { useSubscriptionStore, Subscription, QuotaDefinition, SubscriptionSummary } from '../../stores/subscriptionStore';

function UtilizationBar({ utilization, status }: { utilization: number; status: string }) {
  const colors = {
    ok: { bg: 'bg-slate-100', fill: 'bg-slate-200', text: 'text-slate-500' },
    warning: { bg: 'bg-amber-50', fill: 'bg-amber-400', text: 'text-amber-700' },
    critical: { bg: 'bg-rose-50', fill: 'bg-rose-500', text: 'text-rose-700' },
  };
  const c = colors[status as keyof typeof colors] || colors.ok;

  return (
    <div className="group">
      <div className={`flex justify-between items-center mb-2 ${c.text}`}>
        <span className="text-xs font-medium tracking-wide uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
          {status === 'critical' ? '已用尽' : status === 'warning' ? '接近上限' : '正常'}
        </span>
        <span className="text-sm font-light tabular-nums">
          {Math.round(utilization * 100)}%
        </span>
      </div>
      <div className={`h-[3px] w-full ${c.bg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${c.fill} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(utilization * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'neutral' | 'up' | 'down';
  accent?: boolean;
  accentColor?: string;
}

function StatCard({ label, value, accentColor = 'var(--color-text-primary)' }: StatCardProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-surface) 100%)' }} />
      <div className="relative p-6 pt-5">
        <p className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)', fontSize: '9px', letterSpacing: '0.1em' }}>
          {label}
        </p>
        <p className="text-3xl font-light tracking-tight" style={{ fontFamily: 'var(--font-display)', color: accentColor }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SubscriptionCard({ sub, onEdit, onDelete, onAddQuota }: {
  sub: SubscriptionSummary;
  onEdit: () => void;
  onDelete: () => void;
  onAddQuota: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="group relative bg-[var(--color-surface)] rounded-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      style={{
        animation: 'fadeSlideUp 0.4s ease-out forwards',
        opacity: 0,
      }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-medium text-slate-900 tracking-tight">{sub.name}</h3>
              <span className="text-xs text-slate-400 font-light">{sub.provider}</span>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400">$</span>
                <span className="text-2xl font-light text-slate-900 tabular-nums">{sub.monthlyCost.toFixed(2)}</span>
                <span className="text-xs text-slate-400">/月</span>
              </div>
              {sub.autoRenew && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide">自动续费</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 13.4a2.2 2.2 0 0 1-.78-.98l-3.5-4.6a2 2 0 0 1 0-2.38l.64-.75a2.2 2.2 0 0 1 3.12-.06l2.28 2.54a2.2 2.2 0 0 1 .5 1.56l-1.08 2.86a2.2 2.2 0 0 1-1.9 1.22z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex items-center gap-6 mb-5 pb-5 border-b border-slate-50">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">到期</p>
            <p className="text-sm font-light text-slate-600">{sub.daysUntilRenewal} 天</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">总利用率</p>
            <p className="text-sm font-light text-slate-600">{Math.round(sub.overallUtilization * 100)}%</p>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span>{expanded ? '收起' : '详情'}</span>
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Quota breakdown */}
        {sub.quotaUtilization.length > 0 && (
          <div className={`space-y-4 transition-all duration-300 ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            {sub.quotaUtilization.map((quota) => (
              <div key={quota.id} className="pl-3 border-l border-slate-100">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-slate-700">{quota.name}</span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} {quota.unit}
                  </span>
                </div>
                <UtilizationBar utilization={quota.utilization} status={quota.status} />
              </div>
            ))}
          </div>
        )}

        {sub.quotaUtilization.length === 0 && (
          <div className={`text-center py-4 transition-all duration-300 ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <button
              onClick={onAddQuota}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              + 添加第一个配额
            </button>
          </div>
        )}

        {expanded && sub.quotaUtilization.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <button
              onClick={onAddQuota}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              + 添加配额
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface SubscriptionFormData {
  name: string;
  provider: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
  costPerCycle: number;
  currency: string;
  startDate: string;
  autoRenew: boolean;
  websiteUrl: string;
  notes: string;
}

function SubscriptionModal({ subscription, onSave, onClose }: {
  subscription?: Subscription;
  onSave: (data: SubscriptionFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SubscriptionFormData>({
    name: subscription?.name || '',
    provider: subscription?.provider || '',
    billingCycle: (subscription?.billingCycle as SubscriptionFormData['billingCycle']) || 'monthly',
    costPerCycle: subscription?.costPerCycle || 0,
    currency: subscription?.currency || 'USD',
    startDate: subscription?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    autoRenew: subscription?.autoRenew || false,
    websiteUrl: subscription?.websiteUrl || '',
    notes: subscription?.notes || '',
  });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative bg-[var(--color-surface)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] w-full max-w-md overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-lg font-medium text-slate-900">
            {subscription ? '编辑订阅' : '新建订阅'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {subscription ? '修改订阅信息' : '添加一个新的订阅服务'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
              名称
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
              placeholder="GitHub Copilot"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
              服务商
            </label>
            <input
              type="text"
              required
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
              placeholder="GitHub"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
                计费周期
              </label>
              <select
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value as SubscriptionFormData['billingCycle'] })}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="monthly">月付</option>
                <option value="quarterly">季付</option>
                <option value="yearly">年付</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
                费用
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.costPerCycle}
                  onChange={(e) => setForm({ ...form, costPerCycle: parseFloat(e.target.value) })}
                  className="w-full pl-7 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm tabular-nums"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">
              开始日期
            </label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-slate-700">自动续费</p>
              <p className="text-xs text-slate-400">订阅到期后自动续费</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, autoRenew: !form.autoRenew })}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.autoRenew ? 'bg-[var(--color-ink-soft)]' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform ${form.autoRenew ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] rounded-lg transition-all"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuotaModal({ subscriptionId: _subscriptionId, quota, onSave, onClose }: {
  subscriptionId: string;
  quota?: QuotaDefinition;
  onSave: (data: {
    name: string;
    unit: string;
    monthlyLimit: number;
    warningThreshold: number;
    criticalThreshold: number;
    quotaType: string;
  }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: quota?.name || '',
    unit: quota?.unit || '',
    monthlyLimit: quota?.monthlyLimit || 0,
    warningThreshold: quota?.warningThreshold || 0.8,
    criticalThreshold: quota?.criticalThreshold || 0.95,
    quotaType: quota?.quotaType || 'consumable',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-full max-w-sm overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-lg font-medium text-slate-900">{quota ? '编辑配额' : '新建配额'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">配额名称</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all"
              placeholder="AI Completions"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">单位</label>
            <input
              type="text"
              required
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all"
              placeholder="requests"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">月额度上限</label>
            <input
              type="number"
              required
              min="0"
              value={form.monthlyLimit}
              onChange={(e) => setForm({ ...form, monthlyLimit: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-sm tabular-nums focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">警告阈值</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={form.warningThreshold}
                onChange={(e) => setForm({ ...form, warningThreshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">严重阈值</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={form.criticalThreshold}
                onChange={(e) => setForm({ ...form, criticalThreshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
              取消
            </button>
            <button type="submit" className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] rounded-lg transition-all">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Subscriptions() {
  const { dashboard, loading, fetchDashboard, createSubscription, updateSubscription, deleteSubscription, addQuota, updateQuota } = useSubscriptionStore();
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | undefined>();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [editingQuota, setEditingQuota] = useState<{ subId: string; quota?: QuotaDefinition }>({ subId: '' });

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSaveSub = async (data: SubscriptionFormData) => {
    if (editingSub) {
      await updateSubscription(editingSub.id, data);
    } else {
      await createSubscription(data);
    }
    setShowSubModal(false);
    setEditingSub(undefined);
    fetchDashboard();
  };

  const handleSaveQuota = async (data: {
    name: string;
    unit: string;
    monthlyLimit: number;
    warningThreshold: number;
    criticalThreshold: number;
    quotaType: string;
  }) => {
    if (editingQuota.quota) {
      await updateQuota(editingQuota.subId, editingQuota.quota.id, data);
    } else {
      await addQuota(editingQuota.subId, data);
    }
    setShowQuotaModal(false);
    setEditingQuota({ subId: '' });
    fetchDashboard();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个订阅吗？')) {
      await deleteSubscription(id);
      fetchDashboard();
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1
              className="text-3xl mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
              }}
            >
              订阅管理
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              追踪你的 IDE、Cloud、AI 订阅，最大化价值
            </p>
          </div>
          <button
            onClick={() => { setEditingSub(undefined); setShowSubModal(true); }}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加订阅
          </button>
        </div>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="card p-4">
            <StatCard label="月支出" value={`$${dashboard.stats.totalMonthlySpend.toFixed(2)}`} />
          </div>
          <div className="card p-4">
            <StatCard label="活跃订阅" value={dashboard.stats.activeCount} />
          </div>
          <div className="card p-4">
            <StatCard label="接近上限" value={dashboard.stats.nearLimitCount} accentColor="text-amber-600" />
          </div>
          <div className="card p-4">
            <StatCard label="已用尽" value={dashboard.stats.criticalCount} accentColor="text-rose-600" />
          </div>
        </div>
      )}

      {/* Subscription Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboard?.subscriptions.length === 0 && (
          <div className="col-span-2 card p-12 text-center" style={{ borderStyle: 'dashed' }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>还没有订阅</p>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>添加你的第一个订阅开始管理</p>
            <button
              onClick={() => setShowSubModal(true)}
              className="btn btn-ghost"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加第一个订阅
            </button>
          </div>
        )}

        {dashboard?.subscriptions.map((sub, index) => (
          <div key={sub.id} style={{ animationDelay: `${index * 80}ms` }}>
            <SubscriptionCard
              sub={sub}
              onEdit={() => { setEditingSub(sub as unknown as Subscription); setShowSubModal(true); }}
              onDelete={() => handleDelete(sub.id)}
              onAddQuota={() => { setEditingQuota({ subId: sub.id }); setShowQuotaModal(true); }}
            />
          </div>
        ))}
      </div>

      {/* Usage Modal - Record Usage */}
      {showSubModal && (
        <SubscriptionModal
          subscription={editingSub}
          onSave={handleSaveSub}
          onClose={() => { setShowSubModal(false); setEditingSub(undefined); }}
        />
      )}

      {showQuotaModal && (
        <QuotaModal
          subscriptionId={editingQuota.subId}
          quota={editingQuota.quota}
          onSave={handleSaveQuota}
          onClose={() => { setShowQuotaModal(false); setEditingQuota({ subId: '' }); }}
        />
      )}
    </div>
  );
}
