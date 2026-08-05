import { Github, Star, GitCommit } from 'lucide-react';

export interface GithubRepo {
  name: string;
  stars: number;
  lastActive: string;
}

export interface GithubActivity {
  repos: GithubRepo[];
  weeklyCommits: number[]; // 长度 7，最近 7 天每天的 commit 数
  totalCommits: number;
}

interface GithubWidgetProps {
  data: GithubActivity;
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export default function GithubWidget({ data }: GithubWidgetProps) {
  const maxCommits = Math.max(...data.weeklyCommits, 1);

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Github size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <h3
            className="text-base font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            GitHub 活跃度
          </h3>
        </div>
        <span
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <GitCommit size={11} />
          本周 {data.totalCommits}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Weekly heatmap */}
        <div>
          <p
            className="text-[10px] uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            近 7 日
          </p>
          <div className="flex items-end justify-between gap-1.5 h-20">
            {data.weeklyCommits.map((count, i) => {
              const height = Math.max((count / maxCommits) * 100, 6);
              const intensity = count === 0 ? 0 : Math.min(count / maxCommits, 1);
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex items-end h-full">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${height}%`,
                        backgroundColor:
                          count === 0
                            ? 'var(--color-bg-tertiary)'
                            : `rgba(26, 25, 24, ${0.25 + intensity * 0.75})`,
                      }}
                      title={`${count} commits`}
                    />
                  </div>
                  <span
                    className="text-[9px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {DAY_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Repos */}
        <div>
          <p
            className="text-[10px] uppercase tracking-widest mb-3"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            活跃仓库
          </p>
          <div className="space-y-2">
            {data.repos.slice(0, 3).map((repo) => (
              <div key={repo.name} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-text-tertiary)' }}
                />
                <span
                  className="text-xs flex-1 truncate"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {repo.name}
                </span>
                <span
                  className="text-[10px] flex items-center gap-0.5 flex-shrink-0"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <Star size={9} />
                  {repo.stars}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
