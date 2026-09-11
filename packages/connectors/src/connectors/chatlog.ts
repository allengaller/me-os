import { MeLogIngestClient, type IngestEntryInput, type IngestSummary } from '../lib/ingest.js';

/**
 * chatlog 兼容适配器（社区级 IM 连接器）。
 *
 * ⚠️ 合规提示：chatlog（sjzar/chatlog）项目已于 2025-10 被作者移除，
 * 原因是其核心功能存在合规风险。本适配器不包含任何数据解密逻辑，
 * 只调用「用户本地已部署的兼容服务」的 HTTP API（默认
 * http://127.0.0.1:5030，GET /api/v1/chatlog?talker=…&time=YYYY-MM-DD），
 * 将返回的消息按 MeLog Standard 转换后推送到用户自己的 MeOS。
 * 使用前请自行确认本地数据来源合法、并仅处理属于自己的聊天记录。
 */

export interface ChatlogMessage {
  Id?: number | string;
  Timestamp?: string;
  Talker?: string;
  Sender?: string;
  Message?: string;
  IsChatRoom?: boolean;
  IsSender?: boolean;
}

export type ContactMap = Map<string, string>;

export interface ChatlogConnectorOptions {
  /** chatlog 兼容服务地址 */
  chatlogUrl: string;
  /** MeOS 推送客户端 */
  client: MeLogIngestClient;
  /** 数据源显示名，默认 微信聊天记录 */
  sourceName?: string;
  /** 要同步的会话（wxid / 群 id）；缺省时通过 /api/v1/session 枚举最近会话 */
  talkers?: string[];
  /** 首次运行回溯天数，默认 3 */
  backfillDays?: number;
  fetchImpl?: typeof fetch;
}

export interface ChatlogSyncResult extends IngestSummary {
  days: number;
  talkers: number;
  from: string;
  to: string;
}

const DAY_MS = 24 * 3600 * 1000;

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 闭区间 [startDay, endDay] 内的每一天（YYYY-MM-DD） */
export function dayRange(startDay: string, endDay: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startDay}T00:00:00`);
  const end = new Date(`${endDay}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) return days;
  for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(dayKey(cursor));
  }
  return days;
}

export function buildContactMap(contacts: unknown): ContactMap {
  const map: ContactMap = new Map();
  const list = Array.isArray(contacts)
    ? contacts
    : typeof contacts === 'object' && contacts !== null
      ? ((contacts as { contacts?: unknown[]; data?: unknown[] }).contacts ??
        (contacts as { data?: unknown[] }).data ??
        [])
      : [];
  for (const contact of list as Record<string, unknown>[]) {
    const id = (contact.UserName || contact.username || contact.id) as string | undefined;
    if (!id) continue;
    const name = (contact.Remark || contact.remark || contact.NickName || contact.nickname || id) as string;
    map.set(id, name);
  }
  return map;
}

const MAX_CONTENT_LENGTH = 5000;

export function mapMessage(
  message: ChatlogMessage,
  contacts: ContactMap,
): IngestEntryInput | null {
  if (!message.Id || !message.Timestamp || !message.Talker || !message.Message) return null;
  const occurred = new Date(message.Timestamp.replace(' ', 'T'));
  if (Number.isNaN(occurred.getTime())) return null;

  const displayName = (id?: string) => (id ? contacts.get(id) || id : '未知');
  const actor = message.IsChatRoom
    ? displayName(message.Sender)
    : message.IsSender
      ? '我'
      : displayName(message.Talker);

  return {
    externalId: `chatlog-${message.Id}`,
    category: 'im',
    type: 'chat-message',
    title: `与 ${displayName(message.Talker)} 的对话`,
    content: message.Message.slice(0, MAX_CONTENT_LENGTH),
    actor,
    tags: 'chatlog',
    occurredAt: occurred.toISOString(),
  };
}

export async function runChatlogConnector(options: ChatlogConnectorOptions): Promise<ChatlogSyncResult> {
  if (!/^https?:\/\//.test(options.chatlogUrl)) {
    throw new Error('chatlogUrl 仅支持 http/https 地址');
  }
  const base = options.chatlogUrl.replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  // 今天也在同步范围内；externalId 幂等保证重复拉取只更新
  const today = new Date();
  const endDay = dayKey(today);
  const startDay = dayKey(new Date(today.getTime() - ((options.backfillDays ?? 3) - 1) * DAY_MS));
  const days = dayRange(startDay, endDay);
  if (days.length === 0) {
    return { created: 0, updated: 0, skipped: 0, days: 0, talkers: 0, from: startDay, to: endDay };
  }

  const contacts = await fetchContactMap(base, fetchImpl);

  let talkerIds = options.talkers || [];
  if (talkerIds.length === 0) {
    talkerIds = await fetchRecentTalkers(base, fetchImpl);
  }
  if (talkerIds.length === 0) {
    return { created: 0, updated: 0, skipped: 0, days: 0, talkers: 0, from: startDay, to: endDay };
  }

  const summary: ChatlogSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    days: days.length,
    talkers: talkerIds.length,
    from: days[0],
    to: endDay,
  };

  for (const talker of talkerIds) {
    for (const day of days) {
      const entries: IngestEntryInput[] = [];
      for (const raw of await fetchDay(base, talker, day, fetchImpl)) {
        const entry = mapMessage(raw, contacts);
        if (entry) entries.push(entry);
        else summary.skipped += 1;
      }
      if (entries.length > 0) {
        const result = await options.client.ingest(
          'chatlog',
          options.sourceName || '微信聊天记录',
          'im',
          entries,
          base,
        );
        summary.created += result.created;
        summary.updated += result.updated;
        summary.skipped += result.skipped;
      }
    }
  }
  return summary;
}

async function fetchJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`请求失败（HTTP ${response.status}）：${url}`);
  return response.json();
}

async function fetchContactMap(base: string, fetchImpl: typeof fetch): Promise<ContactMap> {
  try {
    return buildContactMap(await fetchJson(`${base}/api/v1/contact`, fetchImpl));
  } catch {
    return new Map();
  }
}

async function fetchRecentTalkers(base: string, fetchImpl: typeof fetch): Promise<string[]> {
  try {
    const sessions = await fetchJson(`${base}/api/v1/session?limit=20`, fetchImpl);
    const list = Array.isArray(sessions)
      ? sessions
      : ((sessions as { sessions?: unknown[]; data?: unknown[] }).sessions ??
        (sessions as { data?: unknown[] }).data ??
        []);
    const talkers = (list as Record<string, unknown>[])
      .map((s) => (s.Talker || s.talker || s.ChatRoom || s.chatroom) as string | undefined)
      .filter((t): t is string => !!t);
    return [...new Set(talkers)];
  } catch {
    return [];
  }
}

async function fetchDay(
  base: string,
  talker: string,
  day: string,
  fetchImpl: typeof fetch,
): Promise<ChatlogMessage[]> {
  const url = `${base}/api/v1/chatlog?talker=${encodeURIComponent(talker)}&time=${day}`;
  const data = await fetchJson(url, fetchImpl);
  if (Array.isArray(data)) return data as ChatlogMessage[];
  if (Array.isArray((data as { messages?: unknown[] }).messages)) {
    return (data as { messages: ChatlogMessage[] }).messages;
  }
  return [];
}
