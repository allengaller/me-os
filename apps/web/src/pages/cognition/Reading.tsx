import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { Plus, BookOpen, ExternalLink, Star, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

type ReadingType = 'book' | 'article' | 'video' | 'podcast' | 'course';
type ReadingStatus = 'want' | 'reading' | 'done' | 'abandoned';

interface ReadingItem {
  id: string;
  title: string;
  author: string;
  type: ReadingType;
  status: ReadingStatus;
  url?: string;
  note?: string;
  rating?: number;
  topicId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  topic?: { id: string; name: string };
}

interface Topic {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<ReadingType, string> = {
  book: '书籍',
  article: '文章',
  video: '视频',
  podcast: '播客',
  course: '课程',
};

const STATUS_LABELS: Record<ReadingStatus, string> = {
  want: '想读',
  reading: '在读',
  done: '已读',
  abandoned: '弃读',
};

const STATUS_COLORS: Record<ReadingStatus, string> = {
  want: 'bg-blue-50 text-blue-600',
  reading: 'bg-emerald-50 text-emerald-600',
  done: 'bg-slate-50 text-slate-600',
  abandoned: 'bg-gray-50 text-gray-500',
};

const TYPE_COLORS: Record<ReadingType, string> = {
  book: 'bg-violet-50 text-violet-600',
  article: 'bg-sky-50 text-sky-600',
  video: 'bg-rose-50 text-rose-600',
  podcast: 'bg-amber-50 text-amber-600',
  course: 'bg-teal-50 text-teal-600',
};

const STATUSES: ReadingStatus[] = ['want', 'reading', 'done', 'abandoned'];

function ReadingModal({
  item,
  topics,
  onSave,
  onClose,
}: {
  item?: ReadingItem | null;
  topics: Topic[];
  onSave: (data: {
    title: string;
    author: string;
    type: ReadingType;
    url: string;
    note: string;
    topicId: string;
  }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: item?.title || '',
    author: item?.author || '',
    type: item?.type || ('book' as ReadingType),
    url: item?.url || '',
    note: item?.note || '',
    topicId: item?.topicId || '',
  });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h2 className="text-lg font-medium text-slate-900">
            {item ? '编辑阅读' : '添加阅读'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">标题</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
              placeholder="书名或文章标题"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">作者</label>
            <input
              type="text"
              required
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
              placeholder="作者名"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">类型</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ReadingType })}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
            >
              {(Object.entries(TYPE_LABELS) as [ReadingType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">笔记</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 resize-none"
              placeholder="阅读笔记..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-2">关联主题</label>
            <select
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200"
            >
              <option value="">无</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
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

export default function Reading() {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<ReadingStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ReadingItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [itemsRes, topicsRes] = await Promise.all([
        api.get('/reading'),
        api.get('/topics'),
      ]);
      setItems(itemsRes.data.items || itemsRes.data?.data || itemsRes.data || []);
      setTopics(topicsRes.data.topics || topicsRes.data?.data || topicsRes.data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    }

    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: {
    title: string;
    author: string;
    type: ReadingType;
    url: string;
    note: string;
    topicId: string;
  }) => {
    try {
      if (editingItem) {
        await api.patch(`/reading/${editingItem.id}`, data);
      } else {
        await api.post('/reading', { ...data, status: 'want' });
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch {}
  };

  const handleStatusChange = async (item: ReadingItem, newStatus: ReadingStatus) => {
    try {
      await api.patch(`/reading/${item.id}`, { status: newStatus });
      loadData();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/reading/${confirmDelete}`);
      setConfirmDelete(null);
      setExpandedId(null);
      loadData();
    } catch {} finally { setDeleting(false); }
  };

  const handleRating = async (item: ReadingItem, rating: number) => {
    try {
      await api.patch(`/reading/${item.id}`, { rating });
      loadData();
    } catch {}
  };

  const filteredItems = activeStatus === 'all'
    ? items
    : items.filter((i) => i.status === activeStatus);

  const statusCounts = {
    all: items.length,
    want: items.filter((i) => i.status === 'want').length,
    reading: items.filter((i) => i.status === 'reading').length,
    done: items.filter((i) => i.status === 'done').length,
    abandoned: items.filter((i) => i.status === 'abandoned').length,
  };

  if (loading) {
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
            <h1 className="text-2xl font-light text-slate-900 tracking-tight">阅读清单</h1>
            <p className="text-sm text-slate-400 mt-1">管理你的书籍、文章和课程学习</p>
          </div>
          <button
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="bg-[var(--color-ink-soft)] hover:bg-[var(--color-ink-soft-hover)] text-white text-sm font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加阅读
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-50 rounded-lg p-1">
        <button
          onClick={() => setActiveStatus('all')}
          className={`px-3 py-1.5 rounded-md text-sm transition-all ${
            activeStatus === 'all'
              ? 'bg-[var(--color-surface)] text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          全部 ({statusCounts.all})
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              activeStatus === status
                ? 'bg-[var(--color-surface)] text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {STATUS_LABELS[status]} ({statusCounts[status]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-5 group hover:border-slate-200 transition-all"
          >
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <h3 className="text-base font-medium text-slate-900">{item.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{item.author}</p>
              </div>
              <div className="flex items-center gap-1">
                {item.url && (
                  <a
                    href={item.url.startsWith('http://') || item.url.startsWith('https://') ? item.url : `https://${item.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <select
                value={item.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  handleStatusChange(item, e.target.value as ReadingStatus);
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border-0 cursor-pointer appearance-none ${STATUS_COLORS[item.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>

              {item.topic && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-500">
                  {item.topic.name}
                </span>
              )}

              <div className="flex items-center gap-0.5 ml-auto">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={(e) => { e.stopPropagation(); handleRating(item, star); }}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        star <= (item.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>



            {expandedId === item.id && item.note && (
              <div className="mt-4 pt-3 border-t border-slate-50">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.note}</p>
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="暂无阅读项目"
          />
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="删除阅读项目"
        message="确定删除这个阅读项目？此操作不可撤销。"
        variant="danger"
        loading={deleting}
      />

      {showModal && (
        <ReadingModal
          item={editingItem}
          topics={topics}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
