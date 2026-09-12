import { describe, expect, it, vi } from 'vitest';
import {
  computePeriodIncrements,
  fetchRepoMetrics,
  parseRepo,
  runGitHubConnector,
} from './github.js';
import type { BrandApiClient } from '../lib/brand-client.js';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

type UrlHandler = (url: string) => Promise<Response>;
const asFetch = (fn: UrlHandler): typeof fetch => fn as unknown as typeof fetch;

describe('GitHub 仓库解析', () => {
  it('合法格式拆分 owner/name', () => {
    expect(parseRepo('allengaller/me-os')).toEqual({ owner: 'allengaller', name: 'me-os' });
  });
  it('非法格式抛错', () => {
    expect(() => parseRepo('meos')).toThrow(/格式应为/);
    expect(() => parseRepo('a/')).toThrow();
    expect(() => parseRepo('/b')).toThrow();
  });
});

describe('GitHub 数据拉取', () => {
  it('解析 stargazers_count / forks_count / open_issues_count', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe('https://api.github.com/repos/allengaller/me-os');
      return jsonResponse({
        full_name: 'allengaller/me-os',
        owner: { login: 'allengaller' },
        stargazers_count: 42,
        forks_count: 7,
        open_issues_count: 3,
      });
    });
    const snapshot = await fetchRepoMetrics('allengaller/me-os', { fetchImpl: asFetch(fetchImpl) });
    expect(snapshot).toEqual({
      fullName: 'allengaller/me-os',
      author: 'allengaller',
      follower: 42,
      totals: { views: null, likes: 7, comments: 3, shares: null },
    });
  });

  it('HTTP 403 且 rate-limit 归零时提示传 PAT', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ message: 'rate limit' }), {
        status: 403,
        headers: { 'x-ratelimit-remaining': '0' },
      }),
    );
    await expect(fetchRepoMetrics('a/b', { fetchImpl: asFetch(fetchImpl) })).rejects.toThrow(/--token/);
  });

  it('rate-limit 差值：首次基线；下次写出 fork/issue 增量', () => {
    expect(
      computePeriodIncrements({ views: null, likes: 7, comments: 3, shares: null }),
    ).toEqual({ views: null, likes: null, comments: null, shares: null });
    expect(
      computePeriodIncrements(
        { views: null, likes: 9, comments: 4, shares: null },
        { views: null, likes: 7, comments: 3, shares: null },
      ),
    ).toEqual({ views: null, likes: 2, comments: 1, shares: null });
  });
});

describe('GitHub 连接器运行', () => {
  function makeClient() {
    return {
      listChannels: vi.fn(async () => [{ id: 'ch-gh', platform: 'github', name: 'GitHub' }]),
      createChannel: vi.fn(),
      postSnapshot: vi.fn(async () => undefined),
    } as unknown as BrandApiClient & {
      listChannels: ReturnType<typeof vi.fn>;
      postSnapshot: ReturnType<typeof vi.fn>;
    };
  }

  it('首次运行写基线快照并保存游标', async () => {
    const client = makeClient();
    const store: Record<string, Record<string, unknown>> = {};
    const result = await runGitHubConnector({
      repo: 'allengaller/me-os',
      client,
      stateDir: '/tmp',
      stateName: 'brand-github-allengaller/me-os',
      loadState: async (_d, n, f) => ({ ...f, ...(store[n] || {}) }),
      saveState: async (_d, n, s) => {
        store[n] = s;
      },
      fetchImpl: asFetch(async () =>
        jsonResponse({
          full_name: 'allengaller/me-os',
          owner: { login: 'allengaller' },
          stargazers_count: 42,
          forks_count: 7,
          open_issues_count: 3,
        }),
      ),
    });
    expect(result.baseline).toBe(true);
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ channelId: 'ch-gh', followers: 42, views: null, likes: null, shares: null }),
    );
    expect(store['brand-github-allengaller/me-os'].lastTotals).toEqual({
      views: null,
      likes: 7,
      comments: 3,
      shares: null,
    });
  });

  it('第二次运行写出 fork/issue 增量（stars 跟随最新累计值）', async () => {
    const client = makeClient();
    const store: Record<string, Record<string, unknown>> = {
      'brand-github-allengaller/me-os': { lastTotals: { views: null, likes: 7, comments: 3, shares: null } },
    };
    await runGitHubConnector({
      repo: 'allengaller/me-os',
      client,
      stateDir: '/tmp',
      stateName: 'brand-github-allengaller/me-os',
      loadState: async (_d, n, f) => ({ ...f, ...(store[n] || {}) }),
      saveState: async (_d, n, s) => {
        store[n] = s;
      },
      fetchImpl: asFetch(async () =>
        jsonResponse({
          full_name: 'allengaller/me-os',
          owner: { login: 'allengaller' },
          stargazers_count: 45,
          forks_count: 9,
          open_issues_count: 4,
        }),
      ),
    });
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        followers: 45,
        views: null,
        likes: 2,
        comments: 1,
        shares: null,
      }),
    );
  });
});