import { useMemo, useRef, useState } from 'react';

export interface LineSeries {
  key: string;
  color: string;
  name?: string;
}

interface LineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: LineSeries[];
  height?: number;
  yWidth?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

const PAD = { top: 12, right: 14, bottom: 28 };

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function LineChart({
  data,
  xKey,
  series,
  height = 220,
  yWidth = 44,
  showGrid = false,
  showLegend = false,
}: LineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { ticks, xStep, plotW, plotH } = useMemo(() => {
    let max = 0;
    for (const row of data) {
      for (const s of series) {
        const v = Number(row[s.key]) || 0;
        if (v > max) max = v;
      }
    }
    if (max <= 0) max = 1;
    const steps = Math.ceil(max / 4);
    const niceMax = steps * 4;
    const ticks = [0, 1, 2, 3, 4].map((i) => (niceMax / 4) * i);
    const plotW = Math.max(0, (wrapRef.current?.clientWidth ?? 600) - yWidth - PAD.right);
    const plotH = height - PAD.top - PAD.bottom;
    const xStep = data.length > 1 ? plotW / (data.length - 1) : 0;
    return { ticks, xStep, plotW, plotH };
  }, [data, series, height, yWidth]);

  const yOf = (v: number) => PAD.top + plotH - (plotH * Math.min(Math.max(v, 0), ticks[4])) / ticks[4];
  const xOf = (i: number) => yWidth + i * xStep;

  const xTickEvery = Math.max(1, Math.ceil(data.length / 8));

  const handleMove = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || data.length < 2) return;
    const px = e.clientX - rect.left - yWidth;
    const idx = Math.round(px / xStep);
    setHoverIdx(Math.min(Math.max(idx, 0), data.length - 1));
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{ height }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mb-2">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-ink-2)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name || s.key}
            </span>
          ))}
        </div>
      )}
      <svg width="100%" height={showLegend ? height - 26 : height} role="img">
        <defs>
          <clipPath id={`clip-linechart`}>
            <rect x={yWidth} y={PAD.top} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {ticks.map((t) => {
          const y = yOf(t);
          return (
            <g key={t}>
              {showGrid && (
                <line
                  x1={yWidth}
                  x2={yWidth + plotW}
                  y1={y}
                  y2={y}
                  strokeDasharray="3 3"
                  style={{ stroke: 'var(--color-border)' }}
                />
              )}
              <text x={yWidth - 8} y={y + 3} textAnchor="end" fontSize={11} style={{ fill: 'var(--color-ink-3)' }}>
                {t}
              </text>
            </g>
          );
        })}

        {data.map((row, i) => {
          if (i % xTickEvery !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={xOf(i)} y={height - 8} textAnchor="middle" fontSize={11} style={{ fill: 'var(--color-ink-3)' }}>
              {String(row[xKey])}
            </text>
          );
        })}

        {series.map((s) => {
          const pts = data.map((row, i) => ({ x: xOf(i), y: yOf(Number(row[s.key]) || 0) }));
          return (
            <path
              key={s.key}
              d={smoothPath(pts)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {hoverIdx !== null && (
          <g>
            <line
              x1={xOf(hoverIdx)}
              x2={xOf(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              style={{ stroke: 'var(--color-border)' }}
            />
            {series.map((s) => (
              <circle
                key={s.key}
                cx={xOf(hoverIdx)}
                cy={yOf(Number(hovered?.[s.key]) || 0)}
                r={4}
                fill={s.color}
                style={{ stroke: 'var(--color-surface)', strokeWidth: 2 }}
              />
            ))}
          </g>
        )}
      </svg>

      {hovered && hoverIdx !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-md px-3 py-2 text-xs"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-md)',
            left: Math.min(Math.max(xOf(hoverIdx) - 60, 0), (wrapRef.current?.clientWidth ?? 0) - 130),
            top: 4,
          }}
        >
          <p className="mb-1 font-medium" style={{ color: 'var(--color-ink)' }}>
            {String(hovered[xKey])}
          </p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-1.5" style={{ color: 'var(--color-ink-2)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              {s.name || s.key}: {hovered[s.key] ?? 0}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}