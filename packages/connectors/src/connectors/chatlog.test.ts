import { describe, expect, it } from 'vitest';
import { buildContactMap, dayRange, mapMessage, runChatlogConnector } from './chatlog.js';
import { MeLogIngestClient, type IngestEntryInput } from '../lib/ingest.js';

const CONTACTS = buildContactMap([
  { UserName: 'wxid_zhang', Remark: '老张' },
  { UserName: '123@chatroom', NickName: '家人群' },
  { UserName: 'wxid_mom', Remark: '妈妈' },
]);

describe('chatlog 适配器', () => {
  it('should build day ranges inclusively', () => {
    expect(dayRange('2026-09-01', '2026-09-03')).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
    expect(dayRange('2026-09-03', '2026-09-01')).toEqual([]);
  });

  it('should build contact maps from wrapped payloads', () => {
    expect(CONTACTS.get('wxid_zhang')).toBe('老张');
    const wrapped = buildContactMap({ data: [{ username: 'wxid_x', nickname: '小李' }] });
    expect(wrapped.get('wxid_x')).toBe('小李');
  });

  it('should map room messages with sender display names', () => {
    const entry = mapMessage(
      {
        Id: 1001,
        Timestamp: '2026-09-03 21:30:00',
        Talker: '123@chatroom',
        Sender: 'wxid_zhang',
        Message: '周末爬山去吗？',
        IsChatRoom: true,
        IsSender: false,
      },
      CONTACTS,
    );

    expect(entry).toMatchObject({
      externalId: 'chatlog-1001',
      category: 'im',
      type: 'chat-message',
      title: '与 家人群 的对话',
      content: '周末爬山去吗？',
      actor: '老张',
    });
    expect(String(entry!.occurredAt)).toContain('2026-09-03');
  });

  it('should map direct messages and mark own messages as 我', () => {
    const fromMom = mapMessage(
      { Id: 1002, Timestamp: '2026-09-02 12:00:00', Talker: 'wxid_mom', Message: '周末回家吃饭吗', IsSender: false },
      CONTACTS,
    );
    expect(fromMom!.actor).toBe('妈妈');
    expect(fromMom!.title).toBe('与 妈妈 的对话');

    const mine = mapMessage(
      { Id: 1003, Timestamp: '2026-09-02 12:01:00', Talker: 'wxid_mom', Message: '好', IsSender: true },
      CONTACTS,
    );
    expect(mine!.actor).toBe('我');
  });

  it('should skip incomplete messages', () => {
    expect(mapMessage({ Timestamp: '2026-09-02 12:00:00', Talker: 'x', Message: 'no id' }, CONTACTS)).toBeNull();
    expect(mapMessage({ Id: 1, Timestamp: 'not a date', Talker: 'x', Message: 'bad time' }, CONTACTS)).toBeNull();
  });

  it('should sync from a chatlog-compatible service end to end', async () => {
    const pushed: { adapter: string; name: string; entries: IngestEntryInput[] }[] = [];
    const fetchImpl = (async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes('/api/v1/contact')) {
        return jsonResponse([{ UserName: 'wxid_mom', Remark: '妈妈' }]);
      }
      if (href.includes('/api/v1/session')) {
        return jsonResponse([{ Talker: 'wxid_mom' }]);
      }
      if (href.includes('/api/v1/chatlog')) {
        return jsonResponse([
          { Id: 2001, Timestamp: '2026-09-03 08:00:00', Talker: 'wxid_mom', Message: '早上好', IsSender: false },
          { Id: 2002, Timestamp: 'bad time', Talker: 'wxid_mom', Message: '会被跳过' },
        ]);
      }
      throw new Error(`unexpected fetch: ${href}`);
    }) as typeof fetch;

    const client = new MeLogIngestClient({
      apiUrl: 'http://127.0.0.1:3001',
      fetchImpl: (async (input: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        pushed.push({ adapter: body.source.adapter, name: body.source.name, entries: body.entries });
        return new Response(JSON.stringify({ sourceId: 's', created: body.entries.length, updated: 0, skipped: 0 }), {
          status: 200,
        });
      }) as typeof fetch,
    });

    const result = await runChatlogConnector({
      chatlogUrl: 'http://127.0.0.1:5030',
      client,
      sourceName: '微信聊天记录',
      backfillDays: 2,
      fetchImpl,
    });

    expect(result.days).toBe(2);
    expect(result.talkers).toBe(1);
    expect(result.created).toBe(2);
    expect(pushed.length).toBeGreaterThanOrEqual(1);
    expect(pushed[0].adapter).toBe('chatlog');
    expect(pushed[0].entries[0]).toMatchObject({ externalId: 'chatlog-2001', actor: '妈妈' });
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
