import { Github, Mail, FileText, Server, Calendar } from 'lucide-react';

interface QuickLink {
  label: string;
  url: string;
  icon: typeof Github;
}

const links: QuickLink[] = [
  { label: 'GitHub', url: 'https://github.com', icon: Github },
  { label: '邮箱', url: 'https://mail.google.com', icon: Mail },
  { label: '文档', url: 'https://www.notion.so', icon: FileText },
  { label: '服务器', url: 'https://localhost:3001', icon: Server },
  { label: '日历', url: 'https://calendar.google.com', icon: Calendar },
];

export default function QuickNav() {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex items-center gap-2 px-3 py-2 group"
            title={link.label}
          >
            <Icon
              size={15}
              style={{ color: 'var(--color-text-tertiary)' }}
              className="transition-colors group-hover:[color:var(--color-text-primary)]"
            />
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {link.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
