import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Lightbulb, Tag, Clock } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import MockBadge from '../../components/MockBadge';
import { isMockItem } from '../../lib/mockFlag';

interface InsightNote {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  category: string | null;
  mock?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InsightFormData {
  title: string;
  content: string;
  category: string;
  tags: string;
}

const emptyForm: InsightFormData = {
  title: '',
  content: '',
  category: '',
  tags: '',
};

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'insight', label: '灵感' },
  { value: 'learning', label: '学习' },
  { value: 'reflection', label: '反思' },
  { value: 'breakthrough', label: '突破' },
  { value: 'question', label: '疑问' },
];

export default function Insights() {
  const [insights, setInsights] = useState<InsightNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInsight, setEditingInsight] = useState<InsightNote | null>(null);
  const [form, setForm] = useState<InsightFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      params.append('page', String(pagination.page));
      params.append('limit', String(pagination.limit));

      const res = await api.get(`/insights?${params.toString()}`);
      setInsights(res.data?.insights ?? []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
      setInsights([]);
    }

    finally {
      setLoading(false);
    }
  }, [search, category, pagination.page, pagination.limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [search, category]);

  const parseTags = (tagsStr: string | null): string[] => {
    if (!tagsStr) return [];
    try {
      return JSON.parse(tagsStr);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openCreate = () => {
    setEditingInsight(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (insight: InsightNote) => {
    setEditingInsight(insight);
    setForm({
      title: insight.title,
      content: insight.content,
      category: insight.category ?? '',
      tags: parseTags(insight.tags).join(', '),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      };
      if (editingInsight) {
        await api.patch(`/insights/${editingInsight.id}`, payload);
      } else {
        await api.post('/insights', payload);
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingInsight(null);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete);
    try {
      await api.delete(`/insights/${confirmDelete}`);
      setConfirmDelete(null);
      await loadData();
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="flex items-center justify-between mb-8">
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
            洞察笔记
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            记录灵感、困惑、顿悟和重要思考
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus size={16} />
          新增洞察
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="搜索洞察..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input w-40"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className="card p-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            <Lightbulb size={40} strokeWidth={1} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无洞察笔记</p>
            <button onClick={openCreate} className="btn btn-ghost mt-4">
              创建第一条洞察
            </button>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="card p-5 group hover:border-[var(--color-text-tertiary)] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <Lightbulb size={18} style={{ color: 'var(--color-warning)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
                    {insight.title}
                    {isMockItem(insight) && (
                      <MockBadge onClick={async () => { await api.patch(`/insights/${insight.id}`, { mock: false }); loadData(); }} />
                    )}
                  </h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{insight.content}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {insight.category && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                        {CATEGORIES.find((c) => c.value === insight.category)?.label ?? insight.category}
                      </span>
                    )}
                    {parseTags(insight.tags).map((tag, i) => (
                      <span key={i} className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                        <Tag size={10} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full" style={{ color: 'var(--color-text-tertiary)' }}>
                      <Clock size={10} className="mr-1" />
                      {formatDate(insight.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(insight)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(insight.id)}
                    disabled={deleting === insight.id}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--color-error)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="删除洞察笔记"
        message="确定删除这条洞察笔记？此操作不可撤销。"
        variant="danger"
        loading={!!deleting}
      />

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingInsight(null); setForm(emptyForm); }}
        title={editingInsight ? '编辑洞察' : '新增洞察'}
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
              className="input"
              placeholder="洞察标题"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
              内容
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              className="input resize-none"
              placeholder="详细描述你的洞察..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                分类
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input"
              >
                <option value="">选择分类</option>
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>
                标签
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input"
                placeholder="标签1, 标签2"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <button onClick={() => setShowModal(false)} className="btn btn-ghost">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !form.content.trim()}
            className="btn btn-primary"
          >
            {editingInsight ? '保存' : '创建'}
          </button>
        </div>
      </Modal>
    </div>
  );
}