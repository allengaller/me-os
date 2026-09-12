import { describe, expect, it, vi } from 'vitest';
import {
  collectYouTubeSnapshot,
  computePeriodIncrements,
  fetchAllVideoIds,
  fetchChannelInfo,
  fetchVideoStats,
  runYouTubeConnector,
} from './youtube.js';
import type { BrandApiClient } from '../lib/brand-client.js';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const API_KEY = 'test-key';

type UrlHandler = (url: string) => Promise<Response>;
const asFetch = (fn: UrlHandler): typeof fetch => fn as unknown as typeof fetch;

describe('YouTube 频道与视频', () => {
  it('解析频道统计 + uploads playlistId', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/channels?')) {
        expect(url).toContain('key=test-key');
        return jsonResponse({
          items: [
            {
              id: 'UCX',
              snippet: { title: '测试频道' },
              contentDetails: { relatedPlaylists: { uploads: 'UUX' } },
              statistics: { subscriberCount: '1200', videoCount: '42', viewCount: '99999' },
            },
          ],
        });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const info = await fetchChannelInfo('UCX', { apiKey: API_KEY, fetchImpl: asFetch(fetchImpl) });
    expect(info).toMatchObject({
      id: 'UCX',
      title: '测试频道',
      uploadsPlaylistId: 'UUX',
      subscriberCount: 1200,
      channelVideoCount: 42,
    });
  });

  it('投稿列表分页 + videoId 汇总', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/playlistItems')) {
        const pageToken = /[?&]pageToken=([^&]*)/.exec(url)?.[1];
        if (!pageToken) {
          return jsonResponse({
            items: [
              { contentDetails: { videoId: 'v1' } },
              { contentDetails: { videoId: 'v2' } },
            ],
            nextPageToken: 'p2',
          });
        }
        return jsonResponse({ items: [{ contentDetails: { videoId: 'v3' } }] });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const ids = await fetchAllVideoIds('UUX', 100, { apiKey: API_KEY, fetchImpl: asFetch(fetchImpl) });
    expect(ids).toEqual(['v1', 'v2', 'v3']);
  });

  it('按 batch=50 批量取统计；按 ID 索引', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/videos?')) {
        return jsonResponse({
          items: [
            { id: 'v1', statistics: { viewCount: 100, likeCount: 10, commentCount: 5 } },
            { id: 'v2', statistics: { viewCount: 200, likeCount: 20 } },
          ],
        });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const stats = await fetchVideoStats(['v1', 'v2'], { apiKey: API_KEY, fetchImpl: asFetch(fetchImpl) });
    expect(stats.get('v1')).toEqual({ viewCount: 100, likeCount: 10, commentCount: 5 });
    expect(stats.get('v2')).toEqual({ viewCount: 200, likeCount: 20 });
  });

  it('汇总并按上次累计做差值；首次为 null', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/channels?')) {
        return jsonResponse({
          items: [
            {
              id: 'UCX',
              snippet: { title: 'UP' },
              contentDetails: { relatedPlaylists: { uploads: 'UUX' } },
              statistics: { subscriberCount: '1000' },
            },
          ],
        });
      }
      if (url.includes('/playlistItems')) {
        return jsonResponse({ items: [{ contentDetails: { videoId: 'v1' } }] });
      }
      if (url.includes('/videos?')) {
        return jsonResponse({ items: [{ id: 'v1', statistics: { viewCount: 100, likeCount: 10, commentCount: 4 } }] });
      }
      throw new Error(`unexpected url ${url}`);
    });
    const snapshot = await collectYouTubeSnapshot('UCX', { apiKey: API_KEY, fetchImpl: asFetch(fetchImpl), requestDelayMs: 0 });
    expect(snapshot).toMatchObject({
      author: 'UP',
      follower: 1000,
      videoCount: 1,
      totals: { views: 100, likes: 10, comments: 4, shares: null },
    });
    expect(computePeriodIncrements(snapshot.totals)).toEqual({
      views: null,
      likes: null,
      comments: null,
      shares: null,
    });
    expect(
      computePeriodIncrements({ views: 160, likes: 12, comments: 6, shares: null }, snapshot.totals),
    ).toEqual({ views: 60, likes: 2, comments: 2, shares: null });
  });

  it('HTTP 403 给出可操作的错误提示（含配额 / key 失效）', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: { code: 403, message: 'quotaExceeded', reason: 'quotaExceeded' } }), {
        status: 403,
      }),
    );
    await expect(fetchChannelInfo('UCX', { apiKey: API_KEY, fetchImpl: asFetch(fetchImpl) })).rejects.toThrow(
      /配额|API key/,
    );
  });
});

describe('YouTube 连接器运行', () => {
  function makeClient() {
    return {
      listChannels: vi.fn(async () => [{ id: 'ch-yt', platform: 'youtube', name: 'YouTube' }]),
      createChannel: vi.fn(),
      postSnapshot: vi.fn(async () => undefined),
    } as unknown as BrandApiClient & {
      listChannels: ReturnType<typeof vi.fn>;
      postSnapshot: ReturnType<typeof vi.fn>;
    };
  }

  const fetchJson = (videoStat: { viewCount: number; likeCount: number; commentCount: number }) =>
    vi.fn(async (url: string) => {
      if (url.includes('/channels?')) {
        return jsonResponse({
          items: [
            {
              id: 'UCX',
              snippet: { title: 'UP' },
              contentDetails: { relatedPlaylists: { uploads: 'UUX' } },
              statistics: { subscriberCount: '1000' },
            },
          ],
        });
      }
      if (url.includes('/playlistItems')) {
        return jsonResponse({ items: [{ contentDetails: { videoId: 'v1' } }] });
      }
      return jsonResponse({ items: [{ id: 'v1', statistics: videoStat }] });
    });

  it('首次运行写基线快照并保存游标', async () => {
    const client = makeClient();
    const store: Record<string, Record<string, unknown>> = {};
    const result = await runYouTubeConnector({
      channelId: 'UCX',
      apiKey: API_KEY,
      client,
      stateDir: '/tmp',
      stateName: 'brand-youtube-UCX',
      loadState: async (_d, n, f) => ({ ...f, ...(store[n] || {}) }),
      saveState: async (_d, n, s) => {
        store[n] = s;
      },
      fetchImpl: asFetch(fetchJson({ viewCount: 100, likeCount: 10, commentCount: 4 })),
    });
    expect(result.baseline).toBe(true);
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'ch-yt', followers: 1000, views: null, likes: null, shares: null }),
    );
    expect(store['brand-youtube-UCX'].lastTotals).toEqual({ views: 100, likes: 10, comments: 4, shares: null });
  });

  it('第二次运行按累计差值写入增量', async () => {
    const client = makeClient();
    const store: Record<string, Record<string, unknown>> = {
      'brand-youtube-UCX': { lastTotals: { views: 100, likes: 10, comments: 4, shares: null } },
    };
    const result = await runYouTubeConnector({
      channelId: 'UCX',
      apiKey: API_KEY,
      client,
      stateDir: '/tmp',
      stateName: 'brand-youtube-UCX',
      loadState: async (_d, n, f) => ({ ...f, ...(store[n] || {}) }),
      saveState: async (_d, n, s) => {
        store[n] = s;
      },
      fetchImpl: asFetch(fetchJson({ viewCount: 160, likeCount: 12, commentCount: 6 })),
    });
    expect(result.baseline).toBe(false);
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ views: 60, likes: 2, comments: 2, shares: null }),
    );
  });
});