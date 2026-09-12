import { describe, it, expect } from 'vitest';
import { parseCaptureText } from './capture.js';

const NOW = new Date('2026-09-12T09:30:00');

describe('parseCaptureText', () => {
  it('解析潮汐冥想分钟数，时间词今天+早上', () => {
    const items = parseCaptureText('今天早上潮汐冥想15分钟', NOW);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item.type).toBe('meditation');
    expect(item.source).toBe('潮汐');
    expect(item.value).toBe(15);
    expect(item.unit).toBe('minutes');
    expect(item.title).toContain('15');
    expect(item.occurredAt).toBe('2026-09-12T08:00:00');
    expect(item.healthRecord).toEqual({ type: 'custom', value: 15, unit: 'minutes' });
  });

  it('解析 Keep 跑步公里数与配速', () => {
    const items = parseCaptureText('昨天晚上Keep跑步5公里配速5分30秒', NOW);
    const item = items[0];
    expect(item.type).toBe('exercise');
    expect(item.source).toBe('Keep');
    expect(item.value).toBe(5);
    expect(item.unit).toBe('km');
    expect(item.pace).toBe(`5'30"`);
    expect(item.occurredAt).toBe('2026-09-11T20:00:00');
    expect(item.healthRecord).toEqual({ type: 'exercise', value: 5, unit: 'km' });
  });

  it('解析通用运动（力量训练 1 小时 → 60 分钟）', () => {
    const items = parseCaptureText('前天下午力量训练1小时', NOW);
    const item = items[0];
    expect(item.type).toBe('exercise');
    expect(item.value).toBe(60);
    expect(item.unit).toBe('minutes');
    expect(item.occurredAt).toBe('2026-09-10T15:00:00');
  });

  it('解析睡眠小时数（昨晚 + 个半）', () => {
    const items = parseCaptureText('昨晚睡了6个半小时', NOW);
    const item = items[0];
    expect(item.type).toBe('sleep');
    expect(item.value).toBe(6.5);
    expect(item.unit).toBe('hours');
    expect(item.occurredAt).toBe('2026-09-11T20:00:00');
  });

  it('解析体重，无时段默认中午', () => {
    const items = parseCaptureText('今天体重68.5公斤', NOW);
    expect(items[0].type).toBe('weight');
    expect(items[0].value).toBe(68.5);
    expect(items[0].occurredAt).toBe('2026-09-12T12:00:00');
  });

  it('一段话拆出多条打卡', () => {
    const items = parseCaptureText('今天早上潮汐冥想15分钟，昨天睡眠7小时。今天体重68.5公斤', NOW);
    expect(items.map((i) => i.type)).toEqual(['meditation', 'sleep', 'weight']);
    expect(items.every((i) => i.category === 'health')).toBe(true);
  });

  it('识别不了的段落降级为原文笔记', () => {
    const items = parseCaptureText('今天心情不错，跑了5公里', NOW);
    expect(items.map((i) => i.type)).toContain('exercise');
    const note = items.find((i) => i.type === 'note');
    expect(note).toBeDefined();
    expect(note!.category).toBe('note');
    expect(note!.raw).toContain('心情不错');
    expect(note!.healthRecord).toBeNull();
  });

  it('externalId 对相同文本稳定（重复提交幂等）', () => {
    const a = parseCaptureText('今天早上冥想10分钟', NOW);
    const b = parseCaptureText('今天早上冥想10分钟', NOW);
    expect(a[0].externalId).toBe(b[0].externalId);
  });

  it('不同文本的 externalId 不同', () => {
    const a = parseCaptureText('冥想10分钟', NOW);
    const b = parseCaptureText('冥想20分钟', NOW);
    expect(a[0].externalId).not.toBe(b[0].externalId);
  });

  it('步数打卡', () => {
    const items = parseCaptureText('今天走了8000步', NOW);
    expect(items[0].type).toBe('exercise');
    expect(items[0].value).toBe(8000);
    expect(items[0].unit).toBe('steps');
  });

  it('纯空白文本返回空数组', () => {
    expect(parseCaptureText('   ', NOW)).toEqual([]);
  });

  it('「待办：」前缀创建待办，优先于健康词表', () => {
    const items = parseCaptureText('待办：周五前交报告', NOW);
    expect(items[0].type).toBe('todo');
    expect(items[0].todo).toBe('周五前交报告');
    expect(items[0].healthRecord).toBeNull();
    expect(items[0].category).toBe('custom');

    const priority = parseCaptureText('待办：明天冥想15分钟', NOW);
    expect(priority[0].type).toBe('todo');
  });

  it('「笔记：」前缀创建笔记条目，正文去掉前缀', () => {
    const items = parseCaptureText('笔记：今天读到一段关于复利的论述，很有启发', NOW);
    expect(items[0].type).toBe('note');
    expect(items[0].noteContent).toContain('复利');
    expect(items[0].noteContent).not.toContain('笔记');
  });
});
