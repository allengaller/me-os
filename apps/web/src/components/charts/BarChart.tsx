import { useMemo } from 'react';

export interface BarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  valueKey: string;
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}

/** 轻量 SVG 柱状图（与 LineChart 同风格，零依赖） */
export default function BarChart({
  data,
  xKey,
  valueKey,
  height = 200,
  color = '#6366f1',
  valueFormatter = (v) => (v === 0 ? '' : String(v)),
}: BarChartProps) {
  const { bars, max } = useMemo(() => {
    const values = data.map((d) => Math.max(0, Number(d[valueKey]) || 0));
    const max = Math.max(1, ...values);
    return { bars: data.map((d, i) => ({ x: d[xKey], v: values[i] })), max };
  }, [data, xKey, valueKey]);

  const pad = { top: 16, right: 8, bottom: 26, left: 0 };
  const w = 600;
  const h = height;
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const n = bars.length;
  const slot = n > 0 ? innerW / n : innerW;
  const barW = Math.min(26, slot * 0.55);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="柱状图">
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={w - pad.right}
          y1={pad.top + innerH * t}
          y2={pad.top + innerH * t}
          stroke="#e2e8f0"
          strokeWidth={t === 0 ? 1 : 0.5}
          strokeDasharray={t === 0 ? undefined : '4 4'}
        />
      ))}
      {bars.map((b, i) => {
        const x = pad.left + slot * i + (slot - barW) / 2;
        const bh = b.v > 0 ? Math.max(2, (b.v / max) * innerH) : 0;
        const y = pad.top + innerH - bh;
        return (
          <g key={`${b.x}-${i}`}>
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill={b.v > 0 ? color : '#e2e8f0'} />
            <text
              x={x + barW / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {valueFormatter(b.v)}
            </text>
            <text
              x={x + barW / 2}
              y={pad.top + innerH + 14}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
              transform={n > 7 ? `rotate(-35 ${x + barW / 2} ${pad.top + innerH + 14})` : undefined}
            >
              {String(b.x)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}