import { describe, expect, it } from 'vitest';
import { buildSpeakEntries, parseMetrics, speakExternalId } from './speak.js';

describe('speak 口述录入', () => {
  it('should parse common health metrics from natural text', () => {
    const metrics = parseMetrics('今天 8500 步，跑步 5 公里，睡眠 6 小时 40 分钟，体重 62 公斤，消耗 300 千卡');
    expect(metrics).toEqual([
      { key: 'steps', value: 8500, unit: '步', raw: '8500 步' },
      { key: 'distance_km', value: 5, unit: '公里', raw: '5 公里' },
      { key: 'hours', value: 6, unit: '小时', raw: '6 小时' },
      { key: 'minutes', value: 40, unit: '分钟', raw: '40 分钟' },
      { key: 'weight_kg', value: 62, unit: '公斤', raw: '62 公斤' },
      { key: 'calories_kcal', value: 300, unit: '千卡', raw: '300 千卡' },
    ]);
  });

  it('should parse decimals and keep repeated metrics', () => {
    const metrics = parseMetrics('早上 3000 步，晚上 5000 步，跑了 2.5 公里');
    expect(metrics.map((m) => m.raw)).toEqual(['3000 步', '5000 步', '2.5 公里']);
  });

  it('should ignore unrecognizable text', () => {
    expect(parseMetrics('今天状态不错，心情很好')).toEqual([]);
    expect(parseMetrics('')).toEqual([]);
  });

  it('should build idempotent external ids per metric with sequence for repeats', () => {
    expect(speakExternalId('2026-09-12', 'steps')).toBe('speak-2026-09-12-steps');
    expect(speakExternalId('2026-09-12', 'steps', 2)).toBe('speak-2026-09-12-steps-2');
  });

  it('should build metric entries with payload and local midnight timestamp', () => {
    const entries = buildSpeakEntries('今天 8500 步，跑了 2.5 公里', '2026-09-12');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      externalId: 'speak-2026-09-12-steps',
      category: 'custom',
      type: 'health-metric',
      title: '健康指标：8500 步',
      content: '今天 8500 步，跑了 2.5 公里',
      tags: 'melog-speak,health',
    });
    expect(entries[0].occurredAt).toBe('2026-09-11T16:00:00.000Z'); // 本地零点 → UTC 前一日
    expect(JSON.parse(entries[0].payload!)).toMatchObject({ key: 'steps', value: 8500, unit: '步' });
    expect(entries[1].externalId).toBe('speak-2026-09-12-distance_km');
  });

  it('should fall back to a raw note when nothing is recognized', () => {
    const entries = buildSpeakEntries('今天状态不错，心情很好', '2026-09-12');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      externalId: 'speak-2026-09-12-raw',
      category: 'note',
      type: 'oral-record',
      title: '每日口述：2026-09-12',
      content: '今天状态不错，心情很好',
    });
  });
});