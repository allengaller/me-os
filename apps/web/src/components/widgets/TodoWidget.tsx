import { useState } from 'react';
import { Check, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Todo {
  id: string;
  title: string;
  status: 'todo' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

interface TodoWidgetProps {
  todos: Todo[];
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: '#DC2626',
  high: '#EA580C',
  medium: '#64748B',
  low: '#9CA3AF',
};

export default function TodoWidget({ todos: initialTodos }: TodoWidgetProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTitle, setNewTitle] = useState('');

  const toggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t
      )
    );
  };

  const add = () => {
    const title = newTitle.trim();
    if (!title) return;
    setTodos((prev) => [
      { id: Date.now().toString(), title, status: 'todo', priority: 'medium' },
      ...prev,
    ]);
    setNewTitle('');
  };

  const pending = todos.filter((t) => t.status !== 'done');
  const doneCount = todos.length - pending.length;

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-2">
          <h3
            className="text-base font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            今日待办
          </h3>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            {pending.length}/{todos.length}
          </span>
        </div>
        <Link
          to="/action/todos"
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          全部 <ArrowRight size={11} />
        </Link>
      </div>

      {/* Quick add */}
      <div
        className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <Plus size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="快速添加..."
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* List */}
      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {pending.length === 0 && doneCount === 0 && (
          <p
            className="text-sm text-center py-6"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            暂无待办，享受当下
          </p>
        )}
        {pending.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2.5 py-1.5 group cursor-pointer"
            onClick={() => toggle(todo.id)}
          >
            <button
              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
              style={{ border: '1.5px solid var(--color-border)' }}
            >
              <Check
                size={10}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </button>
            <span
              className="text-sm flex-1 truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {todo.title}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: PRIORITY_DOT[todo.priority] }}
            />
          </div>
        ))}
        {doneCount > 0 && (
          <p
            className="text-[11px] pt-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            ✓ {doneCount} 项已完成
          </p>
        )}
      </div>
    </div>
  );
}
