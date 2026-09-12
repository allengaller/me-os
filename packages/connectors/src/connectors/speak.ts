import { type IngestEntryInput } from '../lib/ingest.js';

/**
 * 每日口述录入（speak）——半自动健康数据通道。
 *
 * 适用场景：手机/App 没有可用数据出口（如 vivo 生态、Keep 已封接口），
 * 每天用一句话把 App 里看到的数字带进 MeOS 时间线：
 *   melog-connector speak --text "今天 8500 步，跑步 5 公里，睡眠 6 小时 40 分"
 *
 * 只做正则解析，不做语义理解：提取「数字 + 单位」对为结构化指标，
 * 原文整体保留在 content 中；没有可识别指标时原文按 note 兜底保存。
 */

export interface ParsedMetric {
  key: string;
  value: number;
  unit: string;
  raw: string;
}

const UNIT_PATTERNS: { key: string; patterns: string[] }[] = [
  { key: 'steps', patterns: ['步'] },
  { key: 'distance_km', patterns: ['公里', '千米', 'km'] },
  { key: 'distance_m', patterns: ['米'] },
  { key: 'hours', patterns: ['小时', '钟头'] },
  { key: 'minutes', patterns: ['分钟'] },
  { key: 'weight_kg', patterns: ['公斤', '千克', 'kg'] },
  { key: 'weight_jin', patterns: ['斤'] },
  { key: 'calories_kcal', patterns: ['千卡', '大卡', 'kcal'] },
  { key: 'heart_rate', patterns: ['bpm'] },
  { key: 'times', patterns: ['次', '组'] },
];

export function parseMetrics(text: string): ParsedMetric[] {
  const metrics: ParsedMetric[] = [];
  const matches = text.matchAll(/(\d+(?:\.\d+)?)\s*([\u4e00-\u9fa5A-Za-z]+)/g);
  for (const match of matches) {
    const value = Number(match[1]);
    const unitText = match[2];
    const mapped = UNIT_PATTERNS.find(({ patterns }) => patterns.some((p) => unitText.includes(p)));
    if (mapped) {
      metrics.push({ key: mapped.key, value, unit: unitText, raw: match[0] });
    }
  }
  return metrics;
}

/** 按指标生成幂等 externalId：speak-{YYYY-MM-DD}-{key}（同key重复出现时追加序号避免覆盖） */
export function speakExternalId(dateKey: string, metricKey: string, index = 1): string {
  return index > 1 ? `speak-${dateKey}-${metricKey}-${index}` : `speak-${dateKey}-${metricKey}`;
}

export function buildSpeakEntries(text: string, dateKey: string): IngestEntryInput[] {
  const metrics = parseMetrics(text);
  if (metrics.length === 0) {
    return [
      {
        externalId: `speak-${dateKey}-raw`,
        category: 'note',
        type: 'oral-record',
        title: `每日口述：${dateKey}`,
        content: text,
        tags: 'melog-speak,oral',
        occurredAt: new Date(`${dateKey}T00:00:00`).toISOString(),
      },
    ];
  }
  const counters = new Map<string, number>();
  return metrics.map((metric) => {
    const index = (counters.get(metric.key) ?? 0) + 1;
    counters.set(metric.key, index);
    return {
      externalId: speakExternalId(dateKey, metric.key, index),
      category: 'custom',
      type: 'health-metric',
      title: `健康指标：${metric.raw}`,
      content: text,
      payload: JSON.stringify({ key: metric.key, value: metric.value, unit: metric.unit, raw: metric.raw }),
      tags: 'melog-speak,health',
      occurredAt: new Date(`${dateKey}T00:00:00`).toISOString(),
    };
  });
}