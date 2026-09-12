import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  collectBilibiliSnapshot,
  deriveMixinKey,
  fetchArchiveBvids,
  fetchFollowerCount,
  fetchWbiKeys,
  runBilibiliConnector,
  signWbiParams,
} from './bilibili.js';
import { computeDelta } from '../lib/brand-types.js';
import type { BrandApiClient } from '../lib/brand-client.js';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ code: 0, message: '0', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

type UrlHandler = (url: string) => Promise<Response>;
const asFetch = (fn: UrlHandler): typeof fetch => fn as unknown as typeof fetch;

describe('bilibili Wbi 签名', () => {
  it('mixin key 取置换表前 32 位且确定性', () => {
    const img = '7cd084941338484aae1ad9425b84077c';
    const sub = '4932caff0ff746eab6f01bf08b70ac45';
    const key = deriveMixinKey(img, sub);
    expect(key).toHaveLength(32);
    expect(key).toBe(deriveMixinKey(img, sub));
    // 置换不等同于直接拼接
    expect(key).not.toBe((img + sub).slice(0, 32));
  });

  it('签名参数按 key 排序并追加 w_rid（独立实现对照）', () => {
    const mixinKey = deriveMixinKey('7cd084941338484aae1ad9425b84077c', '4932caff0ff746eab6f01bf08b70ac45');
    const signed = signWbiParams({ foo: 'one', bar: 'two', zab: 3 }, mixinKey, 1702204800);
    const expectedQuery = 'bar=two&foo=one&wts=1702204800&zab=3';
    const expectedRid = createHash('md5').update(expectedQuery + mixinKey).digest('hex');
    expect(signed.wts).toBe(1702204800);
    expect(signed.w_rid).toBe(expectedRid);
  });

  it('签名值按 RFC3986 显式转义 !\'()* 字符', () => {
    const mixinKey = 'a'.repeat(32);
    // encodeURIComponent 不处理 !'()*，签名要求转义为 %21%27%28%29%2A
    const rawQuery = 'q=bang%21%27%28%29%2A&wts=1702204800';
    const signed = signWbiParams({ q: "bang!'()*" }, mixinKey, 1702204800);
    expect(signed.w_rid).toBe(createHash('md5').update(rawQuery + mixinKey).digest('hex'));
  });
});

describe('bilibili 数据拉取（mock fetch）', () => {
  it('解析 wbi keys 与粉丝数', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/x/web-interface/nav')) {
        return jsonResponse({
          wbi_img: {
            img_url: 'https://i0.hdslb.com/bfs/wbi/imgkey123.png',
            sub_url: 'https://i0.hdslb.com/bfs/wbi/subkey456.png',
          },
        });
      }
      if (url.includes('/x/relation/stat')) {
        expect(url).toContain('vmid=42');
        return jsonResponse({ follower: 1234 });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const keys = await fetchWbiKeys({ fetchImpl: asFetch(fetchImpl) });
    expect(keys).toEqual({ imgKey: 'imgkey123', subKey: 'subkey456' });
    expect(await fetchFollowerCount('42', { fetchImpl: asFetch(fetchImpl) })).toBe(1234);
  });

  it('nav 匿名返回 code=-101 时仍可从 data 中取到 wbi keys', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          code: -101,
          message: '账号未登录',
          data: { wbi_img: { img_url: 'https://x/k1.png', sub_url: 'https://x/k2.png' } },
        }),
        { status: 200 },
      ),
    );
    await expect(fetchWbiKeys({ fetchImpl: asFetch(fetchImpl) })).resolves.toEqual({
      imgKey: 'k1',
      subKey: 'k2',
    });
  });

  it('投稿分页：不足一页即停，去封面取 bvid 与作者', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain('w_rid=');
      expect(url).toContain('wts=');
      return jsonResponse({
        page: { count: 2 },
        list: {
          vlist: [
            { bvid: 'BV1aaa', author: '测试UP' },
            { bvid: 'BV1bbb', author: '测试UP' },
          ],
        },
      });
    });
    const { bvids, author } = await fetchArchiveBvids(
      '42',
      { imgKey: 'img', subKey: 'sub' },
      { fetchImpl: asFetch(fetchImpl) },
    );
    expect(bvids).toEqual(['BV1aaa', 'BV1bbb']);
    expect(author).toBe('测试UP');
  });

  it('汇总累计指标并做增量差值；首次运行为基线（null）', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/nav')) {
        return jsonResponse({ wbi_img: { img_url: 'https://x/img.png', sub_url: 'https://x/sub.png' } });
      }
      if (url.includes('relation/stat')) return jsonResponse({ follower: 500 });
      if (url.includes('arc/search')) {
        return jsonResponse({ page: { count: 2 }, list: { vlist: [{ bvid: 'BV1', author: 'UP' }] } });
      }
      if (url.includes('web-interface/view')) {
        return jsonResponse({ stat: { view: 100, like: 10, reply: 4, share: 2 } });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const snapshot = await collectBilibiliSnapshot('42', {
      fetchImpl: asFetch(fetchImpl),
      requestDelayMs: 0,
    });
    expect(snapshot).toMatchObject({
      author: 'UP',
      follower: 500,
      videoCount: 1,
      totals: { views: 100, likes: 10, comments: 4, shares: 2 },
    });

    expect(computeDelta(snapshot.totals)).toEqual({
      views: null,
      likes: null,
      comments: null,
      shares: null,
    });
    expect(
      computeDelta(
        { views: 160, likes: 12, comments: 6, shares: 2 },
        snapshot.totals,
      ),
    ).toEqual({ views: 60, likes: 2, comments: 2, shares: 0 });
  });

  it('maxVideos=0 时仅拉粉丝数，不请求 wbi/投稿接口，增量恒为 null', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).not.toContain('/nav');
      expect(url).not.toContain('arc/search');
      return jsonResponse({ follower: 999 });
    });
    const snapshot = await collectBilibiliSnapshot('42', {
      maxVideos: 0,
      fetchImpl: asFetch(fetchImpl),
    });
    expect(snapshot).toEqual({
      author: null,
      follower: 999,
      videoCount: 0,
      totals: null,
    });
  });

  it('风控 code -352 给出可操作的错误提示', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ code: -352, message: '拦截' }), { status: 200 }));
    await expect(fetchFollowerCount('42', { fetchImpl: asFetch(fetchImpl) })).rejects.toThrow(/--cookie/);
  });
});

describe('bilibili 连接器运行', () => {
  const stateDir = '/tmp/test-state';
  const stateName = 'brand-bilibili-42';

  function makeClient() {
    return {
      listChannels: vi.fn(async () => [
        { id: 'ch-1', platform: 'bilibili', name: 'B站' },
      ]),
      createChannel: vi.fn(),
      postSnapshot: vi.fn(async () => undefined),
      resolveOrCreateChannel: vi.fn(async () => 'ch-1'),
    } as unknown as BrandApiClient & {
      listChannels: ReturnType<typeof vi.fn>;
      postSnapshot: ReturnType<typeof vi.fn>;
      resolveOrCreateChannel: ReturnType<typeof vi.fn>;
    };
  }

  it('首次运行写基线快照（增量为 null）并保存游标', async () => {
    const client = makeClient();
    const store: Record<string, Record<string, unknown>> = {};
    const result = await runBilibiliConnector({
      mid: '42',
      client,
      stateDir,
      stateName,
      loadState: async (_dir, name, fallback) => ({ ...fallback, ...(store[name] || {}) }),
      saveState: async (_dir, name, state) => {
        store[name] = state;
      },
      fetchImpl: asFetch(async (url: string) => {
        if (url.includes('/nav')) {
          return jsonResponse({ wbi_img: { img_url: 'https://x/img.png', sub_url: 'https://x/sub.png' } });
        }
        if (url.includes('relation/stat')) return jsonResponse({ follower: 500 });
        if (url.includes('arc/search')) {
          return jsonResponse({ page: { count: 1 }, list: { vlist: [{ bvid: 'BV1', author: 'UP' }] } });
        }
        return jsonResponse({ stat: { view: 100, like: 10, reply: 4, share: 2 } });
      }),
    });

    expect(result.baseline).toBe(true);
    expect(result.channelId).toBe('ch-1');
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'ch-1', followers: 500, views: null, likes: null }),
    );
    expect(store[stateName].lastTotals).toEqual({ views: 100, likes: 10, comments: 4, shares: 2 });
  });

  it('第二次运行按累计差值写入增量', async () => {
    const client = makeClient();
    const store: Record<string, Record<string, unknown>> = {
      [stateName]: { lastTotals: { views: 100, likes: 10, comments: 4, shares: 2 } },
    };
    const result = await runBilibiliConnector({
      mid: '42',
      client,
      stateDir,
      stateName,
      loadState: async (_dir, name, fallback) => ({ ...fallback, ...(store[name] || {}) }),
      saveState: async (_dir, name, state) => {
        store[name] = state;
      },
      fetchImpl: asFetch(async (url: string) => {
        if (url.includes('/nav')) {
          return jsonResponse({ wbi_img: { img_url: 'https://x/img.png', sub_url: 'https://x/sub.png' } });
        }
        if (url.includes('relation/stat')) return jsonResponse({ follower: 530 });
        if (url.includes('arc/search')) {
          return jsonResponse({ page: { count: 1 }, list: { vlist: [{ bvid: 'BV1', author: 'UP' }] } });
        }
        return jsonResponse({ stat: { view: 160, like: 12, reply: 6, share: 2 } });
      }),
    });

    expect(result.baseline).toBe(false);
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'ch-1',
        followers: 530,
        views: 60,
        likes: 2,
        comments: 2,
        shares: 0,
      }),
    );
  });
});
