/**
 * 品牌快照通用类型：跨平台统一的「累计 → 本周期增量」语义。
 *
 * 每个平台 connectors 暴露自己的累计指标 Totals（数值型 key 表示可计算增量，
 * 固定 null 表示该平台不暴露该指标），快照层把累计减法汇总成本周期增量 Delta。
 */

export type MetricKey = 'views' | 'likes' | 'comments' | 'shares';

/** 各 key 都是数值；不存在则不出现（Partial 让每个平台只声明它有的指标） */
export type Totals = { [K in MetricKey]?: number };

/** 增量：每 key 都是 number 或 null（null = 首次基线或 current 缺失） */
export type Delta = { [K in MetricKey]: number | null };

/** 当前累计 - 上次累计；任一缺失则为 null。 */
export function computeDelta(current: Totals | null | undefined, previous?: Totals | null): Delta {
  const out: Delta = { views: null, likes: null, comments: null, shares: null };
  if (!current) return out;
  if (!previous) return out;
  for (const k of ['views', 'likes', 'comments', 'shares'] as const) {
    const c = current[k];
    const p = previous[k];
    out[k] = typeof c === 'number' && typeof p === 'number' ? Math.max(0, c - p) : null;
  }
  return out;
}

/** 增量求和（聚合多个渠道的 Delta，null 视作 0 跳过） */
export function sumDeltas(deltas: Delta[]): Delta {
  const out: Delta = { views: null, likes: null, comments: null, shares: null };
  for (const k of ['views', 'likes', 'comments', 'shares'] as const) {
    let sum = 0;
    let any = false;
    for (const d of deltas) {
      const v = d[k];
      if (typeof v === 'number') {
        sum += v;
        any = true;
      }
    }
    out[k] = any ? sum : null;
  }
  return out;
}