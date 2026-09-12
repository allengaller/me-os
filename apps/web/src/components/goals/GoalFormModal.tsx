import { GoalForm, Domain } from '../../pages/direction/Goals';

interface GoalFormModalProps {
  form: GoalForm;
  domains: Domain[];
  isEditing: boolean;
  onChange: (form: GoalForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const statusOptions = [
  { value: 'planned', label: '计划中' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'abandoned', label: '已放弃' },
];

const priorityOptions = [
  { value: 'high', label: '高', color: 'text-red-600' },
  { value: 'medium', label: '中', color: 'text-slate-600' },
  { value: 'low', label: '低', color: 'text-gray-500' },
];

export default function GoalFormModal({
  form,
  domains,
  isEditing,
  onChange,
  onSubmit,
  onClose,
}: GoalFormModalProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          目标名称
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
          placeholder="输入目标名称"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          所属领域
        </label>
        <select
          value={form.domainId}
          onChange={(e) => onChange({ ...form, domainId: e.target.value })}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
          required
        >
          <option value="">选择领域</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            优先级
          </label>
          <select
            value={form.priority}
            onChange={(e) => onChange({ ...form, priority: e.target.value as GoalForm['priority'] })}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
            状态
          </label>
          <select
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value as GoalForm['status'] })}
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          描述
        </label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-200 focus:bg-[var(--color-surface)] transition-all text-sm resize-none"
          placeholder="添加描述..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {isEditing ? '保存' : '创建'}
        </button>
      </div>
    </form>
  );
}