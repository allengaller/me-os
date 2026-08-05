import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Topic {
  id: string;
  title: string;
  status: 'exploring' | 'researching' | 'practicing' | 'breakthrough';
  noteCount: number;
}

interface TopicWidgetProps {
  topics: Topic[];
}

const STATUS_CONFIG: Record<
  Topic['status'],
  { label: string; bg: string; color: string }
> = {
  exploring: { label: '探索', bg: '#EEF2FF', color: '#4F46E5' },
  researching: { label: '研究', bg: '#F3E8FF', color: '#7C3AED' },
  practicing: { label: '实践', bg: '#DCFCE7', color: '#16A34A' },
  breakthrough: { label: '突破', bg: '#FEF3C7', color: '#D97706' },
};

export default function TopicWidget({ topics }: TopicWidgetProps) {
  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <h3
            className="text-base font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            学习专题
          </h3>
        </div>
        <Link
          to="/cognition?tab=topics"
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          全部 <ArrowRight size={11} />
        </Link>
      </div>

      <div className="space-y-2.5 flex-1">
        {topics.length === 0 && (
          <p
            className="text-sm text-center py-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            暂无活跃专题
          </p>
        )}
        {topics.map((topic) => {
          const cfg = STATUS_CONFIG[topic.status];
          return (
            <div key={topic.id} className="flex items-center gap-2.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
              <span
                className="text-sm flex-1 truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {topic.title}
              </span>
              <span
                className="text-[10px] flex-shrink-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {topic.noteCount} 笔记
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
