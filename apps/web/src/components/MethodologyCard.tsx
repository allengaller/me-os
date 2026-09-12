import { useState } from 'react';
import { BookOpenText, ChevronDown } from 'lucide-react';
import { METHODOLOGY } from '../lib/methodology';

export default function MethodologyCard({ page }: { page: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const entry = METHODOLOGY[page];
  if (!entry) return null;

  return (
    <div className="mb-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        aria-expanded={!collapsed}
      >
        <BookOpenText size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
        <span className="text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          方法论与指导思想
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          · {entry.title}
        </span>
        <ChevronDown
          size={14}
          className="ml-auto transition-transform"
          style={{ transform: collapsed ? 'none' : 'rotate(180deg)', color: 'var(--color-text-tertiary)', flexShrink: 0 }}
        />
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          <p className="text-sm mb-2.5" style={{ color: 'var(--color-text-primary)', lineHeight: 1.7 }}>
            {entry.philosophy}
          </p>
          <ul className="space-y-1.5">
            {entry.principles.map((principle) => (
              <li key={principle} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>—</span>
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
