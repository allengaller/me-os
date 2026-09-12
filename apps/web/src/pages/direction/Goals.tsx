import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Plus, Target, ChevronDown, ChevronRight, Edit2, Trash2, LayoutList, LayoutGrid } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  order: number;
  goalId: string;
}

interface Goal {
  id: string;
  title: string;
  domainId: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'active' | 'completed' | 'abandoned';
  startDate?: string;
  endDate?: string;
  keyResults?: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export interface Domain {
  id: string;
  name: string;
  icon?: string;
  identifier?: string;
}

export interface GoalForm {
  title: string;
  domainId: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'active' | 'completed' | 'abandoned';
  startDate: string;
  endDate: string;
}

interface KRForm {
  title: string;
  targetValue: string;
  unit: string;
  order: string;
}

const statusTabs = ['all', 'active', 'planned', 'completed', 'abandoned'] as const;
type StatusTab = typeof statusTabs[number];

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  planned: 'bg-blue-50 text-blue-700',
  completed: 'bg-slate-100 text-slate-500',
  abandoned: 'bg-red-50 text-red-600',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-slate-50 text-slate-600',
  low: 'bg-gray-50 text-gray-500',
};

const defaultForm: GoalForm = {
  title: '',
  domainId: '',
  description: '',
  priority: 'medium',
  status: 'planned',
  startDate: '',
  endDate: '',
};

const defaultKRForm: KRForm = {
  title: '',
  targetValue: '',
  unit: '',
  order: '0',
};

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [form, setForm] = useState<GoalForm>(defaultForm);
  const [showKRForm, setShowKRForm] = useState<string | null>(null);
  const [krForm, setKrForm] = useState<KRForm>(defaultKRForm);
  const [editingKR, setEditingKR] = useState<string | null>(null);
  const [editKRValue, setEditKRValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [goalsRes, domainsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/domains'),
      ]);
      setGoals(goalsRes.data.goals || []);
      setDomains(domainsRes.data.domains || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const domainMap = domains.reduce<Record<string, Domain>>((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {});

  const filteredGoals = activeTab === 'all'
    ? goals
    : goals.filter((g) => g.status === activeTab);

  const getProgress = (goal: Goal): number => {
    if (!goal.keyResults || goal.keyResults.length === 0) return 0;
    const total = goal.keyResults.reduce((sum, kr) => {
      const pct = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
      return sum + Math.min(pct, 100);
    }, 0);
    return Math.round(total / goal.keyResults.length);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      domainId: goal.domainId,
      description: goal.description || '',
      priority: goal.priority,
      status: goal.status,
      startDate: goal.startDate ? goal.startDate.split('T')[0] : '',
      endDate: goal.endDate ? goal.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.domainId) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        domainId: form.domainId,
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (editingGoal) {
        await api.patch(`/goals/${editingGoal.id}`, payload);
      } else {
        await api.post('/goals', payload);
      }
      setShowModal(false);
      setEditingGoal(null);
      setForm(defaultForm);
      await loadData();
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/goals/${confirmDelete}`);
      setConfirmDelete(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleShowKRForm = (goalId: string) => {
    setShowKRForm(goalId);
    setKrForm(defaultKRForm);
  };

  const handleAddKR = async (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    try {
      await api.post(`/goals/${goalId}/key-results`, {
        title: krForm.title,
        targetValue: parseFloat(krForm.targetValue) || 0,
        unit: krForm.unit,
        order: parseInt(krForm.order) || 0,
      });
      setShowKRForm(null);
      setKrForm(defaultKRForm);
      loadData();
    } catch (error) {
      console.error('Failed to add key result:', error);
    }
  };

  const handleStartEditKR = (kr: KeyResult) => {
    setEditingKR(kr.id);
    setEditKRValue(String(kr.currentValue));
  };

  const handleSaveKR = async (kr: KeyResult) => {
    try {
      await api.patch(`/goals/${kr.goalId}/key-results/${kr.id}`, {
        currentValue: parseFloat(editKRValue) || 0,
      });
      setEditingKR(null);
      setEditKRValue('');
      loadData();
    } catch (error) {
      console.error('Failed to update key result:', error);
    }
  };

  const handleDeleteKR = async (goalId: string, krId: string) => {
    if (!window.confirm('确定删除这个关键结果？')) return;
    try {
      await api.delete(`/goals/${goalId}/key-results/${krId}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete key result:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const boardColumns: { key: Goal['status']; label: string; color: string }[] = [
    { key: 'active', label: '进行中', color: '#10B981' },
    { key: 'planned', label: '计划中', color: '#3B82F6' },
    { key: 'completed', label: '已完成', color: '#64748B' },
    { key: 'abandoned', label: '已归档', color: '#9CA3AF' },
  ];

  return (
    <div className="page-enter">
      <div className="mb-6 flex justify-between items-end">
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
            目标与项目
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            设置目标并追踪关键结果，看板视图管理项目进度
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--color-surface)] shadow-sm' : ''}`}
              style={{ color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
              title="列表视图"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-[var(--color-surface)] shadow-sm' : ''}`}
              style={{ color: viewMode === 'board' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
              title="看板视图"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            新建目标
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardColumns.map((col) => {
            const colGoals = goals.filter((g) => g.status === col.key);
            return (
              <div key={col.key} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{col.label}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{colGoals.length}</span>
                </div>
                <div className="space-y-3">
                  {colGoals.map((goal) => {
                    const progress = getProgress(goal);
                    const domain = domainMap[goal.domainId];
                    return (
                      <div
                        key={goal.id}
                        className="card p-4 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleOpenEdit(goal)}
                      >
                        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                          {goal.title}
                        </h3>
                        {domain && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 mb-2">
                            {domain.name}
                          </span>
                        )}
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: col.color }}
                              />
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                              {progress}%
                            </span>
                          </div>
                        </div>
                        {goal.keyResults && goal.keyResults.length > 0 && (
                          <p className="text-[10px] mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                            {goal.keyResults.length} 个关键结果
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {colGoals.length === 0 && (
                    <div className="card p-4 text-center border-dashed" style={{ borderStyle: 'dashed', color: 'var(--color-text-tertiary)' }}>
                      <p className="text-xs">暂无项目</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <>
      <div className="flex flex-wrap gap-2 mb-6">
        {statusTabs.map((tab) => {
          const count = tab === 'all'
            ? goals.length
            : goals.filter((g) => g.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-[var(--color-ink-soft)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
              }`}
            >
              {tab}
              {count > 0 && <span className="ml-1.5 opacity-50">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-1">
              {activeTab === 'all' ? 'No goals yet' : `No ${activeTab} goals`}
            </p>
            <button
              onClick={handleOpenAdd}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Create your first goal
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progress = getProgress(goal);
            const isExpanded = expandedId === goal.id;
            const domain = domainMap[goal.domainId];

            return (
              <div
                key={goal.id}
                className="group bg-[var(--color-surface)] rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleExpand(goal.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <h3 className="text-base font-medium text-slate-900 truncate">
                          {goal.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 ml-7 flex-wrap">
                        {domain && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700">
                            {domain.name}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[goal.priority]}`}>
                          {goal.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[goal.status]}`}>
                          {goal.status}
                        </span>
                        {goal.endDate && (
                          <span className="text-[10px] text-slate-400 ml-1">
                            Due {formatDate(goal.endDate)}
                          </span>
                        )}
                      </div>

                      {goal.keyResults && goal.keyResults.length > 0 && (
                        <div className="ml-7 mt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-ink-soft)] rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 w-8 text-right">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-50 px-5 pb-5 pt-3 ml-7">
                    {goal.keyResults && goal.keyResults.length > 0 ? (
                      <div className="space-y-3">
                        {goal.keyResults.map((kr) => {
                          const krProgress = kr.targetValue > 0
                            ? Math.round((kr.currentValue / kr.targetValue) * 100)
                            : 0;

                          return (
                            <div
                              key={kr.id}
                              className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-slate-700 truncate">{kr.title}</p>
                                  <button
                                    onClick={() => handleDeleteKR(goal.id, kr.id)}
                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-slate-600 rounded-full transition-all duration-300"
                                      style={{ width: `${Math.min(krProgress, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-500 shrink-0">
                                    {editingKR === kr.id ? (
                                      <span className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={editKRValue}
                                          onChange={(e) => setEditKRValue(e.target.value)}
                                          className="w-16 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-right"
                                          step="any"
                                        />
                                        <button
                                          onClick={() => handleSaveKR(kr)}
                                          className="px-2 py-1 bg-[var(--color-ink-soft)] text-white text-[10px] rounded hover:bg-slate-800"
                                        >
                                          Save
                                        </button>
                                      </span>
                                    ) : (
                                      <span
                                        onClick={() => handleStartEditKR(kr)}
                                        className="cursor-pointer hover:text-slate-700 transition-colors"
                                      >
                                        {kr.currentValue}/{kr.targetValue} {kr.unit}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mb-2">No key results yet</p>
                    )}

                    {showKRForm === goal.id ? (
                      <form
                        onSubmit={(e) => handleAddKR(e, goal.id)}
                        className="mt-3 p-3 bg-slate-50/50 rounded-lg space-y-2"
                      >
                        <input
                          type="text"
                          placeholder="Key result title"
                          value={krForm.title}
                          onChange={(e) => setKrForm({ ...krForm, title: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Target"
                            value={krForm.targetValue}
                            onChange={(e) => setKrForm({ ...krForm, targetValue: e.target.value })}
                            required
                            className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                            step="any"
                          />
                          <input
                            type="text"
                            placeholder="Unit"
                            value={krForm.unit}
                            onChange={(e) => setKrForm({ ...krForm, unit: e.target.value })}
                            className="w-24 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                          />
                          <input
                            type="number"
                            placeholder="Order"
                            value={krForm.order}
                            onChange={(e) => setKrForm({ ...krForm, order: e.target.value })}
                            className="w-20 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-300"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowKRForm(null)}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => handleShowKRForm(goal.id)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Key Result
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="删除目标"
        message="确定删除这个目标？此操作不可撤销。"
        variant="danger"
      />

      {showModal && (
        <Modal
          open={showModal}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
          title={editingGoal ? '编辑目标' : '新建目标'}
          maxWidth="max-w-lg"
        >
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                标题
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="input"
                placeholder="目标标题"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                领域
              </label>
              <select
                value={form.domainId}
                onChange={(e) => setForm({ ...form, domainId: e.target.value })}
                className="input"
              >
                <option value="">选择领域</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                描述
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="描述你的目标"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  优先级
                </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as GoalForm['priority'] })
                }
                className="input"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  状态
                </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as GoalForm['status'] })
                }
                className="input"
              >
                <option value="planned">计划中</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="abandoned">已放弃</option>
              </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  开始日期
                </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input"
              />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                  结束日期
                </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input"
              />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingGoal(null);
                }}
                className="flex-1 btn btn-ghost"
              >
                取消
              </button>
              <button
                type="submit"
                onClick={handleSubmitGoal}
                disabled={submitting}
                className="flex-1 btn btn-primary"
              >
                {submitting ? '保存中...' : editingGoal ? '更新' : '创建'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      </>
      )}
    </div>
  );
}
