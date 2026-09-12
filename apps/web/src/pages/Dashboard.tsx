import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, Target, BookOpen } from 'lucide-react';
import api from '../lib/api';

interface KeyResult {
  id: string;
  targetValue: number;
  currentValue: number;
}

interface DashboardData {
  domains: { id: string; name: string }[];
  goals: { id: string; title: string; status: string; keyResults?: KeyResult[] }[];
  todos: { id: string; title: string; status: string; dueDate?: string }[];
  habits: { id: string; title: string; color?: string; frequency: string }[];
  topics: { id: string; title: string; status: string }[];
  reflections: { id: string; date?: string }[];
  vision: { content: string } | null;
}



export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    domains: [], goals: [], todos: [], habits: [], topics: [], reflections: [], vision: null,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [domains, goals, todos, habits, topics, reflections, vision] = await Promise.allSettled([
        api.get('/domains'),
        api.get('/goals'),
        api.get('/todos?status=todo,doing,inbox'),
        api.get('/habits'),
        api.get('/topics'),
        api.get('/reflections'),
        api.get('/visions'),
      ]);
      setData({
        domains: domains.status === 'fulfilled' ? domains.value.data.domains || [] : [],
        goals: goals.status === 'fulfilled' ? goals.value.data.goals || [] : [],
        todos: todos.status === 'fulfilled' ? todos.value.data.todos || [] : [],
        habits: habits.status === 'fulfilled' ? habits.value.data.habits || [] : [],
        topics: topics.status === 'fulfilled' ? topics.value.data.topics || [] : [],
        reflections: reflections.status === 'fulfilled' ? reflections.value.data.reflections || [] : [],
        vision: vision.status === 'fulfilled' ? vision.value.data.vision || null : null,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border border-[var(--color-border)] border-t-[var(--color-text-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const activeGoals = data.goals.filter((g) => g.status === 'active');
  const pendingTodos = data.todos.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const activeTopics = data.topics.filter((t) => t.status !== 'archived');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReflection = data.reflections.find((r) =>
    r.date && r.date.startsWith(todayStr)
  );

  const stats = [
    { path: '/direction?tab=goals', label: '方向', value: activeGoals.length, sub: '活跃目标' },
    { path: '/action?tab=todos', label: '行动', value: pendingTodos.length, sub: '待办事项' },
    { path: '/cognition?tab=topics', label: '认知', value: activeTopics.length, sub: '活跃课题' },
    { path: '/reflection?tab=daily', label: '反思', value: todayReflection ? '✓' : '—', sub: todayReflection ? '今日已反思' : '今日未反思' },
    { path: '/resources?tab=assets', label: '资源', value: data.domains.length, sub: '活跃领域' },
  ];

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-3xl mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
          }}
        >
          五维仪表盘
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          方向 · 行动 · 认知 · 反思 · 资源
        </p>
      </div>

      {/* Vision Banner */}
      {data.vision && (
        <div
          className="rounded-xl p-6 mb-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--color-text-primary) 0%, #3D3C38 100%)',
            color: 'var(--color-text-inverse)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-10"
            style={{
              background: 'radial-gradient(circle, currentColor 0%, transparent 70%)',
            }}
          />
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3 opacity-60"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            我的愿景
          </p>
          <p
            className="text-base leading-relaxed max-w-2xl"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
          >
            {data.vision.content}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {stats.map((stat, i) => (
          <Link
            key={stat.path}
            to={stat.path}
            className="card p-5 group"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
              {stat.label}
            </p>
            <p
              className="text-3xl mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {stat.sub}
            </p>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Todos Card */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border-light)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <Circle size={16} className="text-[var(--color-text-secondary)]" />
              </div>
              <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                待办事项
              </h2>
            </div>
            <Link
              to="/action?tab=todos"
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                color: 'var(--color-text-tertiary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              查看全部
            </Link>
          </div>
          <div className="p-5">
            {pendingTodos.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-tertiary)' }}>
                暂无待办
              </p>
            ) : (
              <div className="space-y-3">
                {pendingTodos.slice(0, 5).map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 py-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{
                        border: '1.5px solid var(--color-border)',
                      }}
                    />
                    <span
                      className="text-sm flex-1 truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {todo.title}
                    </span>
                    {todo.dueDate && (
                      <span
                        className="text-[11px] flex-shrink-0"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {new Date(todo.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Habits Card */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border-light)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <Check size={16} className="text-[var(--color-text-secondary)]" />
              </div>
              <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                习惯打卡
              </h2>
            </div>
            <Link
              to="/action/habits"
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                color: 'var(--color-text-tertiary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              查看全部
            </Link>
          </div>
          <div className="p-5">
            {data.habits.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-tertiary)' }}>
                暂无习惯
              </p>
            ) : (
              <div className="space-y-3">
                {data.habits.slice(0, 5).map((habit) => (
                  <div key={habit.id} className="flex items-center gap-3 py-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={habit.color ? { backgroundColor: habit.color } : { backgroundColor: 'var(--color-text-tertiary)' }}
                    />
                    <span className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {habit.title}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {habit.frequency === 'daily' ? '每日' : '每周'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Goals Card */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border-light)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <Target size={16} className="text-[var(--color-text-secondary)]" />
              </div>
              <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                活跃目标
              </h2>
            </div>
            <Link
              to="/direction?tab=goals"
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                color: 'var(--color-text-tertiary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              查看全部
            </Link>
          </div>
          <div className="p-5">
            {activeGoals.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-tertiary)' }}>
                暂无活跃目标
              </p>
            ) : (
              <div className="space-y-4">
                {activeGoals.slice(0, 3).map((goal) => {
                  const krs = goal.keyResults || [];
                  const progress = krs.length > 0
                    ? Math.round(krs.reduce((sum, kr) => sum + (kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0), 0) / krs.length)
                    : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {goal.title}
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {progress}%
                        </span>
                      </div>
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: 'var(--color-ink-soft)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Topics Card */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border-light)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <BookOpen size={16} className="text-[var(--color-text-secondary)]" />
              </div>
              <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                活跃课题
              </h2>
            </div>
            <Link
              to="/cognition?tab=topics"
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                color: 'var(--color-text-tertiary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              查看全部
            </Link>
          </div>
          <div className="p-5">
            {activeTopics.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-tertiary)' }}>
                暂无课题
              </p>
            ) : (
              <div className="space-y-3">
                {activeTopics.slice(0, 4).map((topic) => (
                  <div key={topic.id} className="flex items-center gap-3 py-1">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor:
                          topic.status === 'exploring' ? '#EEF2FF' :
                          topic.status === 'researching' ? '#F3E8FF' :
                          topic.status === 'practicing' ? '#DCFCE7' : '#FEF3C7',
                        color:
                          topic.status === 'exploring' ? '#4F46E5' :
                          topic.status === 'researching' ? '#7C3AED' :
                          topic.status === 'practicing' ? '#16A34A' : '#D97706',
                      }}
                    >
                      {topic.status === 'exploring' ? '探索' :
                       topic.status === 'researching' ? '研究' :
                       topic.status === 'practicing' ? '实践' : '突破'}
                    </span>
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {topic.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}