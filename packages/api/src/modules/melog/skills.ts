import { prisma } from '../../lib/prisma.js';
import type { MeLogEntry } from '@prisma/client';

/**
 * MeLog 内置技能（规则版）。
 *
 * 技能对统一时间线上的条目做启发式聚合，产出 Markdown 报告。
 * 当前的实现是确定性的规则引擎，不依赖外部 LLM；
 * 后续社区技能可以通过相同的 SkillManifest 接口接入模型驱动的实现。
 */

export interface SkillOutput {
  summary: string;
  result: string;
  stats: Record<string, unknown>;
  entryIds: string[];
}

export interface BuiltinSkillDef {
  slug: string;
  name: string;
  description: string;
  version: string;
  defaultPeriodDays: number;
  run(userId: string, periodStart: Date, periodEnd: Date): Promise<SkillOutput>;
}

// ==================== 通用工具 ====================

type Payload = Record<string, unknown>;

function parsePayload(entry: MeLogEntry): Payload {
  if (!entry.payload) return {};
  try {
    const parsed = JSON.parse(entry.payload);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Payload) : {};
  } catch {
    return {};
  }
}

function parseTags(entry: MeLogEntry): string[] {
  return (entry.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function num(payload: Payload, keys: string[]): number | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function trend(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 4) return 'flat';
  const mid = Math.floor(values.length / 2);
  const first = average(values.slice(0, mid)) ?? 0;
  const second = average(values.slice(mid)) ?? 0;
  if (first === 0) return 'flat';
  const delta = (second - first) / first;
  if (delta > 0.1) return 'up';
  if (delta < -0.1) return 'down';
  return 'flat';
}

const TREND_LABEL = { up: '上升', down: '下降', flat: '平稳' } as const;

/** 提取高频关键词：拉丁单词 + 中文二元组 */
export function extractKeywords(texts: string[], topN: number): { word: string; count: number }[] {
  const freq = new Map<string, number>();
  const bump = (word: string) => freq.set(word, (freq.get(word) || 0) + 1);

  for (const text of texts) {
    if (!text) continue;
    for (const match of text.toLowerCase().matchAll(/[a-z][a-z0-9_-]{2,}/g)) bump(match[0]);
    for (const seg of text.replace(/[^\u4e00-\u9fa5]+/g, ' ').split(' ')) {
      for (let i = 0; i < seg.length - 1; i++) bump(seg.slice(i, i + 2));
    }
  }

  const stopWords = new Set([
    '我们', '你们', '他们', '自己', '一个', '这个', '那个', '什么', '怎么', '可以',
    '没有', '就是', '但是', '因为', '所以', '还是', '已经', '现在', '时候', '如果',
    '这些', '那些', '不是', '觉得', '一下', '大家', '今天', '明天', '昨天',
  ]);

  return [...freq.entries()]
    .filter(([word, count]) => count >= 2 && !stopWords.has(word))
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

async function loadEntries(
  userId: string,
  categories: string[],
  periodStart: Date,
  periodEnd: Date,
): Promise<MeLogEntry[]> {
  return prisma.meLogEntry.findMany({
    where: {
      userId,
      category: { in: categories },
      occurredAt: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { occurredAt: 'asc' },
  });
}

function emptyPeriodHint(skillName: string): SkillOutput {
  return {
    summary: `${skillName}：所选时间段内暂无数据`,
    result: `## ${skillName}\n\n所选时间段内没有 MeLog 条目。\n\n请先在「MeLog → 数据源」接入数据源，或通过 \`POST /api/melog/ingest\` 写入条目后再运行本技能。`,
    stats: { entryCount: 0 },
    entryIds: [],
  };
}

// ==================== 技能 1：健康洞察 ====================

const NEGATIVE_MOOD_WORDS = ['累', '疲惫', '焦虑', '压力', '烦', '沮丧', '难过', '紧张', '失眠', 'emo', '崩'];
const POSITIVE_MOOD_WORDS = ['开心', '高兴', '兴奋', '满意', '放松', '轻松', '愉快', '充实'];

interface MetricBucket {
  values: number[];
  count: number;
}

function collectMetric(entries: MeLogEntry[], types: string[], keys: string[]): MetricBucket {
  const bucket: MetricBucket = { values: [], count: 0 };
  for (const entry of entries) {
    if (!types.includes(entry.type)) continue;
    const value = num(parsePayload(entry), keys);
    if (value !== null) {
      bucket.values.push(value);
      bucket.count += 1;
    }
  }
  return bucket;
}

export const healthInsightSkill: BuiltinSkillDef = {
  slug: 'health-insight',
  name: '健康洞察',
  description: '关联健康指标（睡眠/运动）与聊天记录中的情绪表达，识别压力信号',
  version: '0.1.0',
  defaultPeriodDays: 7,
  async run(userId, periodStart, periodEnd) {
    const [healthEntries, imEntries] = await Promise.all([
      loadEntries(userId, ['health'], periodStart, periodEnd),
      loadEntries(userId, ['im'], periodStart, periodEnd),
    ]);

    if (healthEntries.length === 0 && imEntries.length === 0) return emptyPeriodHint('健康洞察');

    const sleep = collectMetric(healthEntries, ['sleep'], ['value', 'hours']);
    const exercise = collectMetric(healthEntries, ['exercise'], ['value', 'minutes']);
    const moodScores = collectMetric(healthEntries, ['mood'], ['value', 'score']);

    // 按“天”聚合情绪表达，用于与睡眠交叉分析
    const moodByDay = new Map<string, { negative: number; positive: number }>();
    const emotionHits: { entry: MeLogEntry; words: string[] }[] = [];
    for (const entry of imEntries) {
      const text = `${entry.title}\n${entry.content || ''}`;
      const negative = NEGATIVE_MOOD_WORDS.filter((w) => text.includes(w));
      const positive = POSITIVE_MOOD_WORDS.filter((w) => text.includes(w));
      if (negative.length === 0 && positive.length === 0) continue;
      emotionHits.push({ entry, words: [...negative, ...positive] });
      const key = dayKey(entry.occurredAt);
      const day = moodByDay.get(key) || { negative: 0, positive: 0 };
      day.negative += negative.length;
      day.positive += positive.length;
      moodByDay.set(key, day);
    }

    // 压力信号：情绪偏负面的当天，若睡眠不足或缺失则提示
    const sleepByDay = new Map<string, number>();
    for (const entry of healthEntries) {
      if (entry.type !== 'sleep') continue;
      const value = num(parsePayload(entry), ['value', 'hours']);
      if (value !== null) sleepByDay.set(dayKey(entry.occurredAt), value);
    }
    const riskDays = [...moodByDay.entries()]
      .filter(([, mood]) => mood.negative > mood.positive)
      .filter(([key]) => (sleepByDay.get(key) ?? 0) < 7)
      .map(([key]) => key)
      .sort();

    const sleepAvg = average(sleep.values);
    const exerciseTotal = exercise.values.reduce((a, b) => a + b, 0);
    const moodAvg = average(moodScores.values);

    const lines: string[] = ['## 健康洞察', '', `统计区间：${dayKey(periodStart)} ~ ${dayKey(periodEnd)}`, ''];

    lines.push('### 身体指标', '');
    lines.push(
      `- 睡眠：${sleep.count ? `${sleep.count} 条记录，平均 ${fmt(Number(sleepAvg!.toFixed(1)))} 小时，趋势${TREND_LABEL[trend(sleep.values)]}` : '暂无记录'}`,
    );
    lines.push(
      `- 运动：${exercise.count ? `${exercise.count} 条记录，累计 ${fmt(exerciseTotal)} 分钟` : '暂无记录'}`,
    );
    lines.push(
      `- 情绪打分：${moodScores.count ? `${moodScores.count} 条记录，平均 ${fmt(Number(moodAvg!.toFixed(1)))} / 5` : '暂无记录'}`,
    );

    lines.push('', '### 沟通中的情绪信号', '');
    if (emotionHits.length === 0) {
      lines.push('本期聊天记录中未检出明显的情绪表达。');
    } else {
      const negativeDays = [...moodByDay.values()].reduce((sum, d) => sum + d.negative, 0);
      const positiveDays = [...moodByDay.values()].reduce((sum, d) => sum + d.positive, 0);
      lines.push(`- 检出 ${emotionHits.length} 条带情绪表达的聊天条目（负面 ${negativeDays} 次 / 正面 ${positiveDays} 次）`);
      for (const hit of emotionHits.slice(0, 5)) {
        lines.push(`  - ${dayKey(hit.entry.occurredAt)}「${hit.entry.title.slice(0, 40)}」命中词：${hit.words.join('、')}`);
      }
    }

    lines.push('', '### 压力提示', '');
    if (riskDays.length === 0) {
      lines.push('未发现“情绪偏负面 + 睡眠不足”叠加的风险日，整体状态平稳。');
    } else {
      lines.push(`以下日期同时出现负面情绪表达与睡眠不足（< 7 小时），建议关注：`);
      for (const day of riskDays.slice(0, 7)) {
        lines.push(`- ${day}（睡眠 ${sleepByDay.get(day) !== undefined ? `${fmt(sleepByDay.get(day)!)} 小时` : '无记录'}）`);
      }
    }

    lines.push('', '### 建议', '');
    let suggestions = 0;
    if (sleepAvg !== null && sleepAvg < 7) {
      lines.push('- 平均睡眠不足 7 小时，尝试提前 30 分钟入睡');
      suggestions += 1;
    }
    if (exercise.count && exerciseTotal < 150) {
      lines.push('- 本期运动量低于 WHO 建议的每周 150 分钟，可安排 3 次 30 分钟以上的有氧');
      suggestions += 1;
    }
    if (riskDays.length > 0) {
      lines.push('- 风险日前后减少高负荷安排，睡前避免刺激性对话');
      suggestions += 1;
    }
    if (suggestions === 0) lines.push('- 数据充足，保持当前节奏');

    return {
      summary: `睡眠 ${sleep.count || '—'} 条 / 运动 ${exercise.count || '—'} 条 / 情绪聊天 ${emotionHits.length} 条，风险日 ${riskDays.length} 天`,
      result: lines.join('\n'),
      stats: {
        entryCount: healthEntries.length + imEntries.length,
        healthEntries: healthEntries.length,
        imEntries: imEntries.length,
        sleepAvgHours: sleepAvg,
        exerciseTotalMinutes: exercise.count ? exerciseTotal : null,
        riskDays: riskDays.length,
      },
      entryIds: [...healthEntries, ...imEntries].map((e) => e.id),
    };
  },
};

// ==================== 技能 2：知识回顾 ====================

export const knowledgeRecallSkill: BuiltinSkillDef = {
  slug: 'knowledge-recall',
  name: '知识回顾',
  description: '总结本期笔记重点关键词，并关联聊天记录中的相关讨论',
  version: '0.1.0',
  defaultPeriodDays: 7,
  async run(userId, periodStart, periodEnd) {
    const [noteEntries, imEntries] = await Promise.all([
      loadEntries(userId, ['note'], periodStart, periodEnd),
      loadEntries(userId, ['im'], periodStart, periodEnd),
    ]);

    if (noteEntries.length === 0) return emptyPeriodHint('知识回顾');

    const keywords = extractKeywords(
      noteEntries.map((e) => `${e.title} ${e.content || ''}`),
      10,
    );

    const tagCount = new Map<string, number>();
    for (const entry of noteEntries) {
      for (const tag of parseTags(entry)) tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
    const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    // 在聊天记录中检索与关键词相关的讨论
    const related: { entry: MeLogEntry; words: string[] }[] = [];
    for (const entry of imEntries) {
      const text = `${entry.title}\n${entry.content || ''}`;
      const words = keywords.filter((k) => text.toLowerCase().includes(k.word.toLowerCase())).map((k) => k.word);
      if (words.length > 0) related.push({ entry, words });
    }
    related.sort((a, b) => b.words.length - a.words.length);

    const lines: string[] = ['## 知识回顾', '', `统计区间：${dayKey(periodStart)} ~ ${dayKey(periodEnd)}`, ''];
    lines.push(`本期共 ${noteEntries.length} 条笔记条目。`, '');

    lines.push('### 主题关键词', '');
    if (keywords.length === 0 && topTags.length === 0) {
      lines.push('笔记内容较短，暂未提取到稳定关键词。');
    } else {
      if (keywords.length > 0) {
        lines.push(keywords.map((k) => `${k.word}（${k.count}）`).join(' · '));
      }
      if (topTags.length > 0) {
        lines.push('', `标签：${topTags.map(([tag, count]) => `#${tag}（${count}）`).join(' ')}`);
      }
    }

    lines.push('', '### 笔记清单', '');
    for (const entry of noteEntries.slice(-15).reverse()) {
      const preview = (entry.content || entry.title).replace(/\s+/g, ' ').slice(0, 60);
      lines.push(`- **${entry.title.slice(0, 50)}**（${dayKey(entry.occurredAt)}）${preview}`);
    }
    if (noteEntries.length > 15) lines.push(`- ……其余 ${noteEntries.length - 15} 条见时间线`);

    lines.push('', '### 相关讨论', '');
    if (related.length === 0) {
      lines.push('聊天记录中未发现与笔记关键词相关的讨论。');
    } else {
      for (const item of related.slice(0, 8)) {
        lines.push(
          `- ${dayKey(item.entry.occurredAt)}「${item.entry.title.slice(0, 40)}」命中：${item.words.join('、')}`,
        );
      }
    }

    return {
      summary: `${noteEntries.length} 条笔记，关键词 ${keywords.length} 个，关联讨论 ${related.length} 条`,
      result: lines.join('\n'),
      stats: {
        entryCount: noteEntries.length + imEntries.length,
        noteEntries: noteEntries.length,
        imEntries: imEntries.length,
        keywords: keywords.map((k) => k.word),
        relatedDiscussions: related.length,
      },
      entryIds: [...noteEntries, ...related.map((r) => r.entry)].map((e) => e.id),
    };
  },
};

// ==================== 技能 3：生活复盘 ====================

const CATEGORY_LABEL: Record<string, string> = {
  health: '健康',
  note: '笔记',
  im: '沟通',
  media: '媒体',
  location: '足迹',
  custom: '其他',
};

export const lifeRecapSkill: BuiltinSkillDef = {
  slug: 'life-recap',
  name: '生活复盘',
  description: '把一段时间内的健康、沟通、笔记等条目汇总成每日复盘报告',
  version: '0.1.0',
  defaultPeriodDays: 1,
  async run(userId, periodStart, periodEnd) {
    const entries = await loadEntries(
      userId,
      ['health', 'note', 'im', 'media', 'location', 'custom'],
      periodStart,
      periodEnd,
    );

    if (entries.length === 0) return emptyPeriodHint('生活复盘');

    const byDay = new Map<string, MeLogEntry[]>();
    for (const entry of entries) {
      const key = dayKey(entry.occurredAt);
      const list = byDay.get(key) || [];
      list.push(entry);
      byDay.set(key, list);
    }

    const lines: string[] = ['## 生活复盘', '', `统计区间：${dayKey(periodStart)} ~ ${dayKey(periodEnd)}，共 ${entries.length} 条`, ''];

    for (const day of [...byDay.keys()].sort().reverse()) {
      const dayEntries = byDay.get(day)!;
      lines.push(`### ${day}`, '');

      const byCategory = new Map<string, MeLogEntry[]>();
      for (const entry of dayEntries) {
        const list = byCategory.get(entry.category) || [];
        list.push(entry);
        byCategory.set(entry.category, list);
      }

      for (const [category, list] of byCategory) {
        const label = CATEGORY_LABEL[category] || category;
        if (category === 'im') {
          const actors = new Map<string, number>();
          for (const entry of list) {
            if (entry.actor) actors.set(entry.actor, (actors.get(entry.actor) || 0) + 1);
          }
          const topActors = [...actors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
          lines.push(`- **${label}**：${list.length} 条${topActors.length ? `，主要对话：${topActors.map(([a, c]) => `${a}（${c}）`).join('、')}` : ''}`);
        } else if (category === 'health') {
          const sleepHours = collectMetric(list, ['sleep'], ['value', 'hours']).values;
          const exerciseMinutes = collectMetric(list, ['exercise'], ['value', 'minutes']).values;
          const parts: string[] = [`${list.length} 条`];
          if (sleepHours.length) parts.push(`睡眠 ${fmt(Number(average(sleepHours)!.toFixed(1)))} 小时`);
          if (exerciseMinutes.length) parts.push(`运动 ${fmt(exerciseMinutes.reduce((a, b) => a + b, 0))} 分钟`);
          lines.push(`- **${label}**：${parts.join('，')}`);
        } else {
          const titles = list.slice(0, 3).map((e) => e.title.slice(0, 30));
          lines.push(`- **${label}**：${list.length} 条${titles.length ? `（${titles.join('、')}）` : ''}`);
        }
      }
      lines.push('');
    }

    const imEntries = entries.filter((e) => e.category === 'im');
    const noteEntries = entries.filter((e) => e.category === 'note');
    const healthEntries = entries.filter((e) => e.category === 'health');

    return {
      summary: `${byDay.size} 天 / ${entries.length} 条：沟通 ${imEntries.length}、笔记 ${noteEntries.length}、健康 ${healthEntries.length}`,
      result: lines.join('\n'),
      stats: {
        entryCount: entries.length,
        days: byDay.size,
        byCategory: countByCategory(entries),
      },
      entryIds: entries.map((e) => e.id),
    };
  },
};

function countByCategory(entries: MeLogEntry[]): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.category, (counts.get(entry.category) || 0) + 1);
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

// ==================== 注册表 ====================

export const builtinSkills: BuiltinSkillDef[] = [healthInsightSkill, knowledgeRecallSkill, lifeRecapSkill];

export function getBuiltinSkill(slug: string): BuiltinSkillDef | undefined {
  return builtinSkills.find((skill) => skill.slug === slug);
}

/** 确保内置技能已为该用户安装（幂等，不覆盖用户配置） */
export async function ensureBuiltinSkills(userId: string): Promise<void> {
  for (const skill of builtinSkills) {
    await prisma.meLogSkill.upsert({
      where: { userId_slug: { userId, slug: skill.slug } },
      update: {},
      create: {
        userId,
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
        version: skill.version,
        source: 'builtin',
        isActive: true,
      },
    });
  }
}
