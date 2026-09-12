import type { BrandApiClient } from '../lib/brand-client.js';

/**
 * GitHub 仓库指标适配器（公开 REST API）。
 *
 * 数据来源：GitHub 公开 REST API（https://api.github.com），无需鉴权。
 * 速率限制：未鉴权 60 次/小时/IP；鉴权（PAT）5000 次/小时。
 *
 * 字段映射（GitHub 字段 → 品牌快照语义的最接近近似）：
 * - followers → stargazers_count（关注/订阅最接近 stars）
 * - totals.likes → forks_count（最接近的「喜欢/分享」）
 * - totals.comments → open_issues_count（最接近的「评论/讨论」）
 * - totals.views → null（GitHub 仓库不公开视图数）
 * - totals.shares → null（仓库无分享量字段）
 */

const API_BASE = 'https://api.github.com';

export interface GitHubFetchOptions {
  fetchImpl?: typeof fetch;
  /** 可选 GitHub PAT，未鉴权 60 次/小时；传 PAT 后 5000 次/小时 */
  token?: string;
}

export interface GitHubTotals {
  views: null;
  likes: number;
  comments: number;
  shares: null;
}

export interface GitHubSnapshot {
  fullName: string;
  author: string;
  follower: number;
  totals: GitHubTotals;
}

export interface PeriodIncrements {
  views: null;
  likes: number | null;
  comments: number | null;
  shares: null;
}

export function parseRepo(repo: string): { owner: string; name: string } {
  const slash = repo.indexOf('/');
  if (slash <= 0 || slash === repo.length - 1) {
    throw new Error(`仓库格式应为 owner/name：${repo}`);
  }
  return { owner: repo.slice(0, slash), name: repo.slice(slash + 1) };
}

function makeFetcher(options: GitHubFetchOptions) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  return async (url: string): Promise<unknown> => {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'meos-connectors',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
    });
    if (response.status === 404) {
      throw new Error(`GitHub 仓库不存在或无权访问（HTTP 404）：${url}`);
    }
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error(
          `GitHub API 速率配额已用尽（HTTP 403）：可通过 --token 传个人访问令牌以获得更高配额（5000/小时）`,
        );
      }
      throw new Error(`GitHub API 拒绝访问（HTTP 403）：${url}`);
    }
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`GitHub API 请求失败（HTTP ${response.status}）：${text.slice(0, 200)}`);
    }
    return response.json();
  };
}

export async function fetchRepoMetrics(repo: string, options: GitHubFetchOptions = {}): Promise<GitHubSnapshot> {
  const { owner, name } = parseRepo(repo);
  const get = makeFetcher(options);
  const data = (await get(`${API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`)) as {
    full_name?: string;
    owner?: { login?: string };
    stargazers_count?: number;
    forks_count?: number;
    open_issues_count?: number;
  };
  const fullName = data.full_name ?? `${owner}/${name}`;
  const author = data.owner?.login ?? owner;
  return {
    fullName,
    author,
    follower: data.stargazers_count ?? 0,
    totals: {
      views: null,
      likes: data.forks_count ?? 0,
      comments: data.open_issues_count ?? 0,
      shares: null,
    },
  };
}

export function computePeriodIncrements(
  current: GitHubTotals,
  previous?: GitHubTotals,
): PeriodIncrements {
  if (!previous) return { views: null, likes: null, comments: null, shares: null };
  return {
    views: null,
    likes: Math.max(0, current.likes - previous.likes),
    comments: Math.max(0, current.comments - previous.comments),
    shares: null,
  };
}

export interface GitHubConnectorOptions extends GitHubFetchOptions {
  repo: string;
  client?: BrandApiClient;
  explicitChannelId?: string;
  note?: string;
  dryRun?: boolean;
  stateDir: string;
  stateName: string;
  loadState: <T extends Record<string, unknown>>(dir: string, name: string, fallback: T) => Promise<T>;
  saveState: (dir: string, name: string, state: Record<string, unknown>) => Promise<void>;
}

export interface GitHubConnectorResult {
  channelId: string | null;
  channelName: string | null;
  fullName: string;
  follower: number;
  totals: GitHubTotals;
  increments: PeriodIncrements;
  baseline: boolean;
}

export async function runGitHubConnector(options: GitHubConnectorOptions): Promise<GitHubConnectorResult> {
  const snapshot = await fetchRepoMetrics(options.repo, options);
  const state = await options.loadState<Record<string, unknown>>(options.stateDir, options.stateName, {});
  const previous = state.lastTotals as GitHubTotals | undefined;
  const increments = computePeriodIncrements(snapshot.totals, previous);
  const baseline = !previous;

  if (options.dryRun || !options.client) {
    return {
      channelId: options.explicitChannelId ?? null,
      channelName: null,
      fullName: snapshot.fullName,
      follower: snapshot.follower,
      totals: snapshot.totals,
      increments,
      baseline,
    };
  }

  const channelId = await resolveChannel(options);
  await options.client.postSnapshot({
    channelId,
    followers: snapshot.follower,
    views: null,
    likes: increments.likes,
    comments: increments.comments,
    shares: null,
    note: options.note ?? `github 连接器：${snapshot.fullName}（来源：GitHub API）${baseline ? ' · 首次基线' : ''}`,
  });
  await options.saveState(options.stateDir, options.stateName, {
    repo: options.repo,
    lastRunAt: new Date().toISOString(),
    lastTotals: snapshot.totals,
  });

  return {
    channelId,
    channelName: null,
    fullName: snapshot.fullName,
    follower: snapshot.follower,
    totals: snapshot.totals,
    increments,
    baseline,
  };
}

async function resolveChannel(options: GitHubConnectorOptions): Promise<string> {
  if (!options.client) throw new Error('缺少 BrandApiClient');
  if (options.explicitChannelId) return options.explicitChannelId;
  const channels = await options.client.listChannels();
  const githubChannels = channels.filter((c) => c.platform === 'github' || c.platform === 'custom');
  if (githubChannels.length === 1) return githubChannels[0].id;
  if (githubChannels.length > 1) {
    const ids = githubChannels.map((c) => `${c.name}(${c.id})`).join('、');
    throw new Error(`存在多个 GitHub 渠道：${ids}。请用 --channel-id 指定目标渠道`);
  }
  const created = await options.client.createChannel({
    platform: 'github',
    name: 'GitHub',
    handle: options.repo,
    positioning: '作品库指标（stars / forks / issues）',
  });
  return created.id;
}