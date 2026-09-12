import { Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Goal {
  id: string;
  title: string;
  progress: number; // 0-100
}

interface GoalWidgetProps {
  goals: Goal[];
}

export default function GoalWidget({ goals }: GoalWidgetProps) {
  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <h3
            className="text-base font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            近期目标
          </h3>
        </div>
        <Link
          to="/direction?tab=goals"
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          全部 <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-4 flex-1">
        {goals.length === 0 && (
          <p
            className="text-sm text-center py-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            暂无活跃目标
          </p>
        )}
        {goals.map((goal) => (
          <div key={goal.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {goal.title}
              </span>
              <span
                className="text-[11px] font-medium"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {goal.progress}%
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(goal.progress, 100)}%`,
                  backgroundColor: 'var(--color-ink-soft)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
