import { createHash } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { resolveSource } from './service.js';

/**
 * 口述打卡：把听写来的自由文本解析成结构化健康打卡。
 *
 * 句式契约（也展示在前端录入框提示里）：
 *   时间（今天/昨天/前天 + 早上/上午/下午/晚上）+ 来源（潮汐/Keep）+ 动作 + 数量
 * 支持冥想分钟、跑步公里（含配速）、常见运动时长、睡眠小时、体重公斤、步数；
 * 一段话按标点拆成多条，识别不了的段落降级为 note 原文条目，不丢信息。
 */

export type CaptureType = 'meditation' | 'exercise' | 'sleep' | 'weight' | 'note' | 'todo';

export interface ParsedCapture {
  index: number;
  category: 'health' | 'note' | 'custom';
  type: CaptureType;
  title: string;
  value: number | null;
  unit: string | null;
  source: string | null;
  pace: string | null;
  occurredAt: string;
  raw: string;
  externalId: string;
  healthRecord: { type: string; value: number; unit: string } | null;
  /** 设置后走「待办」通道：直接创建 Todo，不写时间线/健康记录 */
  todo?: string;
  /** 「笔记：」前缀的正文（去掉前缀），无前缀的降级笔记保留原文 */
  noteContent?: string;
}

const SOURCE_PATTERNS: [RegExp, string][] = [
  [/潮汐|tide/i, '潮汐'],
  [/keep/i, 'Keep'],
];

const EXERCISE_VERBS = [
  '力量训练',
  '健身',
  '力量',
  '撸铁',
  '拉伸',
  '瑜伽',
  '骑行',
  '骑车',
  '单车',
  '游泳',
  '跳绳',
  '散步',
  '走路',
  '步行',
  '快走',
  '慢跑',
];

/** 从片段里提取时长（分钟）；支持 X 分钟 / 半小时 / X 小时 */
function durationMinutes(segment: string): number | null {
  const half = segment.match(/半个?小时/);
  if (half) return 30;
  const minutes = segment.match(/(\d+(?:\.\d+)?)\s*(?:分钟?|min\b)/i);
  if (minutes) return Number(minutes[1]);
  const hours = segment.match(/(\d+(?:\.\d+)?)\s*个?小时/);
  if (hours) return Number(hours[1]) * 60;
  return null;
}

function formatNumber(value: number): string {
  return String(Number(value.toFixed(2)));
}

function hashId(text: string): string {
  return createHash('sha1').update(text.replace(/\s+/g, '')).digest('hex').slice(0, 8);
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 解析时间词：返回（相对天数偏移，小时；无时段词为 null） */
function resolveTimeWords(
  segment: string,
): { dayOffset: number; hour: number | null } {
  let dayOffset = 0;
  if (/前天/.test(segment)) dayOffset = -2;
  else if (/昨天|昨日/.test(segment)) dayOffset = -1;
  else if (/今天|今日/.test(segment)) dayOffset = 0;

  if (/昨晚/.test(segment)) return { dayOffset: -1, hour: 20 };
  if (/凌晨/.test(segment)) return { dayOffset, hour: 5 };
  if (/早上|早晨|清晨/.test(segment)) return { dayOffset, hour: 8 };
  if (/上午/.test(segment)) return { dayOffset, hour: 10 };
  if (/中午/.test(segment)) return { dayOffset, hour: 12 };
  if (/下午/.test(segment)) return { dayOffset, hour: 15 };
  if (/晚上|夜里|夜晚/.test(segment)) return { dayOffset, hour: 20 };
  return { dayOffset, hour: null };
}

function occurredAtOf(now: Date, dayOffset: number, hour: number | null): string {
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour ?? 12);
  const h = String(base.getHours()).padStart(2, '0');
  return `${dateKey(base)}T${h}:00:00`;
}

function detectSource(segment: string): string | null {
  for (const [pattern, name] of SOURCE_PATTERNS) {
    if (pattern.test(segment)) return name;
  }
  return null;
}

/** 对单个片段尝试匹配一种打卡；不匹配返回 null */
function matchSegment(segment: string): Omit<ParsedCapture, 'index' | 'occurredAt' | 'externalId'> | null {
  const source = detectSource(segment);

  // 显式路由前缀（优先于健康词表，方便把一句话直接送进待办/笔记）
  const todoMatch = segment.match(/^(?:待办|todo|任务)[：:]\s*(.+)$/i);
  if (todoMatch) {
    const title = todoMatch[1].trim();
    if (title) {
      return {
        category: 'custom',
        type: 'todo',
        title: `待办：${title.slice(0, 24)}`,
        value: null,
        unit: null,
        source: null,
        pace: null,
        raw: segment,
        todo: title,
        healthRecord: null,
      };
    }
  }
  const noteMatch = segment.match(/^(?:笔记|备忘|note)[：:]\s*(.+)$/i);
  if (noteMatch) {
    const content = noteMatch[1].trim();
    if (content) {
      return {
        category: 'note',
        type: 'note',
        title: content.slice(0, 20) + (content.length > 20 ? '…' : ''),
        value: null,
        unit: null,
        source,
        pace: null,
        raw: segment,
        noteContent: content,
        healthRecord: null,
      };
    }
  }

  // 冥想：冥想/正念 + 时长
  const meditation = segment.match(/冥想|正念/);
  if (meditation) {
    const minutes = durationMinutes(segment);
    if (minutes) {
      return {
        category: 'health',
        type: 'meditation',
        title: `${source || ''}冥想 ${formatNumber(minutes)} 分钟`,
        value: minutes,
        unit: 'minutes',
        source,
        pace: null,
        raw: segment,
        healthRecord: { type: 'custom', value: minutes, unit: 'minutes' },
      };
    }
  }

  // 跑步：公里数（配速可选）
  const run = segment.match(/跑(?:步)?(?:了)?\s*(\d+(?:\.\d+)?)\s*(?:公里|千米|km)/i);
  if (run) {
    const km = Number(run[1]);
    const paceMatch = segment.match(/配速\s*(?:(\d+)\s*分(?:钟)?\s*(\d+)\s*秒?|(\d+)\s*[’'"]\s*(\d+)?)/);
    let pace: string | null = null;
    if (paceMatch) {
      const m = paceMatch[1] ?? paceMatch[3];
      const s = paceMatch[2] ?? paceMatch[4] ?? '00';
      pace = `${m}'${s}"`;
    }
    return {
      category: 'health',
      type: 'exercise',
      title: `${source || ''}跑步 ${formatNumber(km)} 公里${pace ? `（配速 ${pace}）` : ''}`,
      value: km,
      unit: 'km',
      source,
      pace,
      raw: segment,
      healthRecord: { type: 'exercise', value: km, unit: 'km' },
    };
  }

  // 睡眠：X 小时（支持 6个半小时）
  const sleep = segment.match(/睡(?:了|眠)?\s*(\d+(?:\.\d+)?)\s*(?:个)?\s*(半)?\s*小时/);
  if (sleep) {
    const hours = Number(sleep[1]) + (sleep[2] ? 0.5 : 0);
    return {
      category: 'health',
      type: 'sleep',
      title: `睡眠 ${formatNumber(hours)} 小时`,
      value: hours,
      unit: 'hours',
      source: null,
      pace: null,
      raw: segment,
      healthRecord: { type: 'sleep', value: hours, unit: 'hours' },
    };
  }

  // 体重
  const weight = segment.match(/体重\s*(\d+(?:\.\d+)?)\s*(?:公斤|千克|kg)/i);
  if (weight) {
    const kg = Number(weight[1]);
    return {
      category: 'health',
      type: 'weight',
      title: `体重 ${formatNumber(kg)} 公斤`,
      value: kg,
      unit: 'kg',
      source: null,
      pace: null,
      raw: segment,
      healthRecord: { type: 'weight', value: kg, unit: 'kg' },
    };
  }

  // 步数
  if (/(走路|散步|步行|走了|步数)/.test(segment)) {
    const steps = segment.match(/(\d{2,6})\s*步/);
    if (steps) {
      const count = Number(steps[1]);
      return {
        category: 'health',
        type: 'exercise',
        title: `步行 ${count} 步`,
        value: count,
        unit: 'steps',
        source,
        pace: null,
        raw: segment,
        healthRecord: { type: 'exercise', value: count, unit: 'steps' },
      };
    }
  }

  // 通用运动：动词 + 时长
  const verb = EXERCISE_VERBS.find((v) => segment.includes(v));
  if (verb) {
    const minutes = durationMinutes(segment);
    if (minutes) {
      return {
        category: 'health',
        type: 'exercise',
        title: `${verb} ${formatNumber(minutes)} 分钟`,
        value: minutes,
        unit: 'minutes',
        source,
        pace: null,
        raw: segment,
        healthRecord: { type: 'exercise', value: minutes, unit: 'minutes' },
      };
    }
  }

  // 都不匹配：整段作为原文笔记保留
  if (segment.trim()) {
    return {
      category: 'note',
      type: 'note',
      title: segment.trim().slice(0, 20) + (segment.trim().length > 20 ? '…' : ''),
      value: null,
      unit: null,
      source,
      pace: null,
      raw: segment,
      healthRecord: null,
    };
  }
  return null;
}

export function parseCaptureText(text: string, now: Date = new Date()): ParsedCapture[] {
  const segments = text
    .split(/[，。；,;！？!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const items: ParsedCapture[] = [];
  for (const segment of segments) {
    const matched = matchSegment(segment);
    if (!matched) continue;
    const { dayOffset, hour } = resolveTimeWords(segment);
    const occurredAt = occurredAtOf(now, dayOffset, hour);
    items.push({
      ...matched,
      index: items.length,
      occurredAt,
      externalId: `capture-${dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset))}-${matched.type}-${hashId(segment)}`,
    });
  }
  return items;
}

export interface CommitCaptureResult {
  created: number;
  updated: number;
  healthRecords: number;
  todos: number;
}

/**
 * 把解析出的条目双写：MeLog 时间线（挂「手动记录」数据源，externalId 幂等）
 * + 健康记录（note 内嵌 externalId 标记防重）。返回写入统计。
 */
export async function commitCaptures(userId: string, items: ParsedCapture[]): Promise<CommitCaptureResult> {
  const { id: sourceId } = await resolveSource(userId, {
    source: { adapter: 'manual', name: '手动记录', category: 'custom' },
    entries: [],
  });

  let created = 0;
  let updated = 0;
  let healthRecords = 0;
  let todos = 0;

  for (const item of items) {
    const occurredAt = new Date(item.occurredAt);

    if (item.todo) {
      await prisma.todo.create({
        data: { userId, title: item.todo, source: 'capture' },
      });
      todos += 1;
      continue;
    }

    const data = {
      category: item.category,
      type: item.type,
      title: item.title,
      content: item.category === 'note' ? (item.noteContent ?? item.raw) : undefined,
      payload: JSON.stringify({
        ...(item.value !== null ? { value: item.value, unit: item.unit } : {}),
        ...(item.source ? { source: item.source } : {}),
        ...(item.pace ? { pace: item.pace } : {}),
        raw: item.raw,
      }),
      tags: item.type === 'todo' ? '口述打卡,待办' : '口述打卡',
      occurredAt,
    };

    const existing = await prisma.meLogEntry.findUnique({
      where: { sourceId_externalId: { sourceId, externalId: item.externalId } },
      select: { id: true },
    });
    if (existing) {
      await prisma.meLogEntry.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.meLogEntry.create({
        data: { ...data, userId, sourceId, externalId: item.externalId },
      });
      created += 1;
    }

    if (item.healthRecord) {
      const marker = `melog:${item.externalId}`;
      const recordExists = await prisma.healthRecord.findFirst({
        where: { userId, note: { contains: marker } },
        select: { id: true },
      });
      if (!recordExists) {
        await prisma.healthRecord.create({
          data: {
            userId,
            type: item.healthRecord.type,
            value: item.healthRecord.value,
            unit: item.healthRecord.unit,
            note: `口述打卡 ${marker}：${item.raw}`,
            recordedAt: occurredAt,
          },
        });
        healthRecords += 1;
      }
    }
  }

  const entryCount = await prisma.meLogEntry.count({ where: { sourceId } });
  await prisma.meLogSource.update({
    where: { id: sourceId },
    data: { entryCount, lastSyncAt: new Date(), status: 'connected' },
  });

  return { created, updated, healthRecords, todos };
}
