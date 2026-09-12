import type { BrandApiClient } from '../lib/brand-client.js';

/**
 * YouTube 快照适配器（Data API v3）。
 *
 * 数据来源：官方 YouTube Data API v3（https://developers.google.com/youtube/v3），
 * 需要在 Google Cloud Console 启用 API 并申请 API key（默认有免费配额 10000 单位/天）。
 * 与 B站不同：不需要登录 OAuth，但需要 API key；无需 Cookie。
 *
 * 字段映射（官方接口对社交媒体语义的最接近近似）：
 * - followers → subscriberCount（订阅数）
 * - totals.views → 累计视频 viewCount 之和
 * - totals.likes → 累计视频 likeCount 之和
 * - totals.comments → 累计视频 commentCount 之和
 * - totals.shares → null（Data API 不公开分享数）
 */

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const MAX_BATCH = 50;

export interface YouTubeFetchOptions {
  fetchImpl?: typeof fetch;
  /** YouTube Data API v3 key */
  apiKey?: string;
  requestDelayMs?: number;
}

export interface YouTubeTotals {
  views: number;
  likes: number;
  comments: number;
  shares: null;
}

export interface YouTubeSnapshot {
  author: string | null;
  follower: number;
  videoCount: number;
  totals: YouTubeTotals;
}

export interface PeriodIncrements {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: null;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  uploadsPlaylistId: string;
  subscriberCount: number;
  channelVideoCount: number;
  channelViewCount: number;
}

function makeFetcher(options: YouTubeFetchOptions) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  if (!options.apiKey) {
    throw new Error('缺少 YouTube API key：请在 Google Cloud Console 启用 YouTube Data API v3 并生成 API key，通过 --api-key 或环境变量 YOUTUBE_API_KEY 传入');
  }
  return async (url: string): Promise<unknown> => {
    const fullUrl = url.includes('key=') ? url : `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(options.apiKey!)}`;
    const response = await fetchImpl(fullUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let detail = text.slice(0, 200);
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string; reason?: string } };
        if (parsed.error?.message) detail = `${parsed.error.message}${parsed.error.reason ? `（${parsed.error.reason}）` : ''}`;
      } catch {
        // 忽略 JSON 解析错误，保留原始 detail
      }
      if (response.status === 400) {
        throw new Error(`YouTube API 请求非法（HTTP 400）：${detail}`);
      }
      if (response.status === 403) {
        throw new Error(
          `YouTube API 拒绝访问（HTTP 403）：${detail}。常见原因：API key 未启用 YouTube Data API v3、配额超限、或 channelId 无权访问`,
        );
      }
      if (response.status === 404) {
        throw new Error(`YouTube API 资源不存在（HTTP 404）：${detail}（请检查 channelId 是否正确）`);
      }
      throw new Error(`YouTube API 请求失败（HTTP ${response.status}）：${detail}`);
    }
    return response.json();
  };
}

export async function fetchChannelInfo(channelId: string, options: YouTubeFetchOptions = {}): Promise<YouTubeChannelInfo> {
  const get = makeFetcher(options);
  const data = (await get(`${API_BASE}/channels?part=statistics,snippet,contentDetails&id=${encodeURIComponent(channelId)}`)) as {
    items?: Array<{
      id: string;
      snippet?: { title?: string };
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
      statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
    }>;
  };
  const item = data.items?.[0];
  if (!item) throw new Error(`YouTube 频道不存在：${channelId}`);
  const title = item.snippet?.title ?? null;
  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error(`YouTube 频道 ${channelId} 未提供 uploads 播放列表（无法拉取视频）`);
  const subscriberCount = Number(item.statistics?.subscriberCount ?? 0);
  const channelVideoCount = Number(item.statistics?.videoCount ?? 0);
  const channelViewCount = Number(item.statistics?.viewCount ?? 0);
  void title;
  void channelViewCount;
  return { id: item.id, title: title ?? '', uploadsPlaylistId, subscriberCount, channelVideoCount, channelViewCount };
}

/** 拉全部视频 ID（分页 maxResults=50，最多 maxVideos 条） */
export async function fetchAllVideoIds(
  uploadsPlaylistId: string,
  maxVideos: number,
  options: YouTubeFetchOptions,
): Promise<string[]> {
  const get = makeFetcher(options);
  const ids: string[] = [];
  let pageToken: string | undefined;
  while (ids.length < maxVideos) {
    const params = new URLSearchParams({
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.min(MAX_BATCH, maxVideos - ids.length)),
    });
    if (pageToken) params.set('pageToken', pageToken);
    const data = (await get(`${API_BASE}/playlistItems?${params.toString()}`)) as {
      items?: Array<{ contentDetails?: { videoId?: string } }>;
      nextPageToken?: string;
    };
    for (const item of data.items ?? []) {
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return ids.slice(0, maxVideos);
}

interface VideoStats {
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

/** 批量取视频统计（每批最多 50 个 ID） */
export async function fetchVideoStats(videoIds: string[], options: YouTubeFetchOptions): Promise<Map<string, VideoStats>> {
  const get = makeFetcher(options);
  const stats = new Map<string, VideoStats>();
  for (let i = 0; i < videoIds.length; i += MAX_BATCH) {
    const batch = videoIds.slice(i, i + MAX_BATCH);
    const idParam = batch.map((id) => encodeURIComponent(id)).join(',');
    const data = (await get(`${API_BASE}/videos?part=statistics&id=${idParam}`)) as {
      items?: Array<{ id?: string; statistics?: VideoStats }>;
    };
    for (const item of data.items ?? []) {
      if (!item.id) continue;
      stats.set(item.id, item.statistics ?? {});
    }
  }
  return stats;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function collectYouTubeSnapshot(
  channelId: string,
  options: YouTubeFetchOptions & { maxVideos?: number } = {},
): Promise<YouTubeSnapshot> {
  const maxVideos = options.maxVideos ?? 50;
  const info = await fetchChannelInfo(channelId, options);
  const videoIds = await fetchAllVideoIds(info.uploadsPlaylistId, maxVideos, options);
  const statsMap = await fetchVideoStats(videoIds, options);

  const totals: YouTubeTotals = { views: 0, likes: 0, comments: 0, shares: null };
  const delay = options.requestDelayMs ?? 100;
  for (let i = 0; i < videoIds.length; i += 1) {
    const stat = statsMap.get(videoIds[i]) ?? {};
    totals.views += stat.viewCount ?? 0;
    totals.likes += stat.likeCount ?? 0;
    totals.comments += stat.commentCount ?? 0;
    if (delay > 0 && i < videoIds.length - 1) await sleep(delay);
  }
  return {
    author: info.title,
    follower: info.subscriberCount,
    videoCount: videoIds.length,
    totals,
  };
}

export function computePeriodIncrements(
  current: YouTubeTotals,
  previous?: YouTubeTotals,
): PeriodIncrements {
  if (!previous) return { views: null, likes: null, comments: null, shares: null };
  return {
    views: Math.max(0, current.views - previous.views),
    likes: Math.max(0, current.likes - previous.likes),
    comments: Math.max(0, current.comments - previous.comments),
    shares: null,
  };
}

export interface YouTubeConnectorOptions extends YouTubeFetchOptions {
  channelId: string;
  client?: BrandApiClient;
  explicitChannelId?: string;
  maxVideos?: number;
  note?: string;
  dryRun?: boolean;
  stateDir: string;
  stateName: string;
  loadState: <T extends Record<string, unknown>>(dir: string, name: string, fallback: T) => Promise<T>;
  saveState: (dir: string, name: string, state: Record<string, unknown>) => Promise<void>;
}

export interface YouTubeConnectorResult {
  channelId: string | null;
  channelName: string | null;
  author: string | null;
  follower: number;
  videoCount: number;
  totals: YouTubeTotals;
  increments: PeriodIncrements;
  baseline: boolean;
}

export async function runYouTubeConnector(options: YouTubeConnectorOptions): Promise<YouTubeConnectorResult> {
  const snapshot = await collectYouTubeSnapshot(options.channelId, options);
  const state = await options.loadState<Record<string, unknown>>(options.stateDir, options.stateName, {});
  const previous = state.lastTotals as YouTubeTotals | undefined;
  const increments = computePeriodIncrements(snapshot.totals, previous);
  const baseline = !previous;

  if (options.dryRun || !options.client) {
    return {
      channelId: options.explicitChannelId ?? null,
      channelName: null,
      author: snapshot.author,
      follower: snapshot.follower,
      videoCount: snapshot.videoCount,
      totals: snapshot.totals,
      increments,
      baseline,
    };
  }

  const channelId = await resolveChannel(options);
  await options.client.postSnapshot({
    channelId,
    followers: snapshot.follower,
    views: increments.views,
    likes: increments.likes,
    comments: increments.comments,
    shares: null,
    note:
      options.note ??
      `youtube 连接器：${snapshot.videoCount} 个视频累计（来源：Data API v3）${baseline ? ' · 首次基线' : ''}`,
  });
  await options.saveState(options.stateDir, options.stateName, {
    channelId: options.channelId,
    lastRunAt: new Date().toISOString(),
    lastTotals: snapshot.totals,
  });

  return {
    channelId,
    channelName: null,
    author: snapshot.author,
    follower: snapshot.follower,
    videoCount: snapshot.videoCount,
    totals: snapshot.totals,
    increments,
    baseline,
  };
}

async function resolveChannel(options: YouTubeConnectorOptions): Promise<string> {
  if (!options.client) throw new Error('缺少 BrandApiClient');
  if (options.explicitChannelId) return options.explicitChannelId;
  const channels = await options.client.listChannels();
  const youtubeChannels = channels.filter((c) => c.platform === 'youtube');
  if (youtubeChannels.length === 1) return youtubeChannels[0].id;
  if (youtubeChannels.length > 1) {
    const ids = youtubeChannels.map((c) => `${c.name}(${c.id})`).join('、');
    throw new Error(`存在多个 YouTube 渠道：${ids}。请用 --channel-id 指定目标渠道`);
  }
  const created = await options.client.createChannel({
    platform: 'youtube',
    name: 'YouTube',
    handle: options.channelId,
    positioning: '国际延伸——田野长视频与 build in public',
  });
  return created.id;
}