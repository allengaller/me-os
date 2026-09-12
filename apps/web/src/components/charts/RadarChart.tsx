import { useMemo } from 'react';

export interface RadarEntry {
  label: string;
  value: number;
}

interface RadarChartProps {
  data: RadarEntry[];
  max?: number;
  height?: number;
  color?: string;
  labelColor?: string;
  gridColor?: string;
}

const W = 320;
const H = 340;
const CX = 160;
const CY = 172;
const R = 108;

export default function RadarChart({
  data,
  max = 10,
  height,
  color = 'var(--color-accent)',
  labelColor = 'var(--color-ink-2)',
  gridColor = 'var(--color-border)',
}: RadarChartProps) {
  const verts = useMemo(() => {
    const n = data.length;
    const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return data.map((_, i) => {
      const a = angle(i);
      return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
    });
  }, [data]);

  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center" style={{ height: height || H }}>
        <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>至少需要 3 个维度</p>
      </div>
    );
  }

  const ring = (f: number) =>
    (data as never[]).map((_, i) => {
      const v = verts[i];
      return `${CX + (v.x - CX) * f},${CY + (v.y - CY) * f}`;
    }).join(' ');

  const scores = data.map((d) => Math.min(Math.max(d.value, 0), max) / max);
  const poly = verts.map((v, i) => {
    const f = scores[i];
    return `${CX + (v.x - CX) * f},${CY + (v.y - CY) * f}`;
  }).join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: height || 'auto', maxWidth: height ? undefined : 360, margin: '0 auto', display: 'block' }}
      role="img"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={ring(f)}
          fill="none"
          stroke={gridColor}
          strokeWidth={f === 1 ? 1.5 : 1}
          style={f === 1 ? { stroke: 'var(--color-border)' } : { stroke: gridColor }}
        />
      ))}
      {verts.map((v, i) => (
        <line key={i} x1={CX} y1={CY} x2={v.x} y2={v.y} style={{ stroke: gridColor }} />
      ))}
      <polygon points={poly} style={{ fill: color, fillOpacity: 0.25, stroke: color, strokeWidth: 2, strokeLinejoin: 'round' }} />
      {verts.map((v, i) => {
        const a = Math.atan2(v.y - CY, v.x - CX);
        const lx = CX + (v.x - CX) * 1.3;
        const ly = CY + (v.y - CY) * 1.3;
        const anchor = a > Math.PI / 2 || a < -Math.PI / 2 ? 'end' : a > -Math.PI / 6 && a < Math.PI / 6 ? 'middle' : 'start';
        return (
          <text key={i} x={lx} y={ly + 4} textAnchor={anchor} fontSize={12} style={{ fill: labelColor }}>
            {data[i].label}
          </text>
        );
      })}
    </svg>
  );
}