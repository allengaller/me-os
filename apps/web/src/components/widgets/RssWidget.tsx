import { Rss, ExternalLink } from 'lucide-react';

export interface RssItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
}

interface RssWidgetProps {
  items: RssItem[];
}

export default function RssWidget({ items }: RssWidgetProps) {
  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Rss size={14} style={{ color: 'var(--color-text-tertiary)' }} />
        <h3
          className="text-base font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          信息流
        </h3>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {items.length === 0 && (
          <p
            className="text-sm text-center py-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            暂无新内容
          </p>
        )}
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-sm leading-snug flex-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {item.title}
              </p>
              <ExternalLink
                size={11}
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {item.source}
              </span>
              <span style={{ color: 'var(--color-border)' }}>·</span>
              <span
                className="text-[10px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {item.time}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
