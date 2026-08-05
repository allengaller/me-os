import { Link } from 'react-router-dom';
import { PenLine, ArrowRight } from 'lucide-react';

interface ReflectionCtaProps {
  done: boolean;
}

export default function ReflectionCta({ done }: ReflectionCtaProps) {
  return (
    <Link
      to="/reflection?tab=daily"
      className="card p-5 flex items-center justify-between group transition-all hover:shadow-md"
      style={{
        background: done
          ? 'var(--color-bg-secondary)'
          : 'linear-gradient(135deg, var(--color-text-primary) 0%, #3D3C38 100%)',
        color: done ? 'var(--color-text-primary)' : 'var(--color-text-inverse)',
        border: 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <PenLine size={18} className="opacity-70" />
        <div>
          <p
            className="text-sm font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {done ? '今日已复盘' : '写今日复盘'}
          </p>
          <p className="text-xs opacity-60 mt-0.5">
            {done ? '记录已沉淀' : '记录收获与明日计划'}
          </p>
        </div>
      </div>
      <ArrowRight
        size={16}
        className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
      />
    </Link>
  );
}
