import { useState } from 'react';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Habit {
  id: string;
  title: string;
  color: string;
  done: boolean;
}

interface HabitWidgetProps {
  habits: Habit[];
}

export default function HabitWidget({ habits: initialHabits }: HabitWidgetProps) {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);

  const toggle = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  const doneCount = habits.filter((h) => h.done).length;
  const progress = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <h3
            className="text-base font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            习惯打卡
          </h3>
        </div>
        <Link
          to="/action/habits"
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          全部 <ArrowRight size={11} />
        </Link>
      </div>

      {/* Progress ring + habits */}
      <div className="flex items-center gap-5 flex-1">
        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="var(--color-bg-tertiary)"
              strokeWidth="5"
            />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="var(--color-text-primary)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.5s var(--ease-out)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-lg"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
              }}
            >
              {doneCount}
            </span>
            <span
              className="text-[10px]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              / {habits.length}
            </span>
          </div>
        </div>

        {/* Habit list */}
        <div className="flex-1 space-y-1.5">
          {habits.slice(0, 4).map((habit) => (
            <button
              key={habit.id}
              onClick={() => toggle(habit.id)}
              className="w-full flex items-center gap-2.5 py-1 group"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: habit.color }}
              />
              <span
                className="text-sm flex-1 text-left truncate"
                style={{
                  color: habit.done
                    ? 'var(--color-text-tertiary)'
                    : 'var(--color-text-primary)',
                  textDecoration: habit.done ? 'line-through' : 'none',
                }}
              >
                {habit.title}
              </span>
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  backgroundColor: habit.done
                    ? 'var(--color-success)'
                    : 'var(--color-bg-tertiary)',
                }}
              >
                {habit.done && (
                  <Check size={10} style={{ color: 'var(--color-text-inverse)' }} />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
