import { createHash } from 'node:crypto';
import type { BrandApiClient } from '../lib/brand-client.js';
import type { Delta, Totals } from '../lib/brand-types.js';
import {
  runBrandPipeline,
  type BrandFollowerSnapshot,
} from '../lib/brand-pipeline.js';

/**
 * B站（bilibili）品牌快照适配器。
 *
 * ⚠️ 接入说明：数据来自 B站 Web 公开接口（社区维护的 bilibili-API-collect 文档化行为），
 * 非官方开放 API，不受 SLA 保护：
 * - 粉丝数：GET /x/relation/stat?vmid={mid}（无需签名）
 * - 投稿列表：GET /x/space/wbi/arc/search（需 Wbi 签名，2023 起强制）
 * - 单视频数据：GET /x/web-interface/view?bvid={bvid}（无需签名）
 *
 * 快照语义与 MeOS 约定一致：followers 累计；views/likes/comments/shares 为
 * 与上次累计相比的本周期增量，首次运行（follower-only 模式或基线）增量为 null。
 *
 * follower-only 模式（--max-videos 0）：collect 不拉投稿，仅写粉丝数；游标不更新。
 */

const API_BASE = 'https://api.bilibili.com';

/** Wbi 签名用的置换表（bilibili-API-collect 文档值，随官方前端更新可能变化） */
const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28,
  14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54,
  21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

export interface BilibiliTotals extends Totals {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface BilibiliFetchOptions {
  fetchImpl?: typeof fetch;
  /** 可选：浏览器 Cookie（SESSDATA 等），降低风控概率，不传也可用 */
  cookie?: string;
  /** 单视频请求并发度（默认 8）。B站 -352 风控对此敏感 */
  videoConcurrency?: number;
  /** 每批并发之间的退避延迟（毫秒），0 表示不 sleep */
  requestDelayMs?: number;
}

export function deriveMixinKey(imgKey: string, subKey: string): string {
  const combined = imgKey + subKey;
  return MIXIN_KEY_ENC_TAB.map((i) => combined[i]).join('').slice(0, 32);
}

/** 构造 Wbi 签名参数：加 wts → 按 key 排序 → RFC3986 转义（!'()* 需显式转义）→ md5(query + mixinKey) */
export function signWbiParams(
  params: Record<string, string | number>,
  mixinKey: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Record<string, string | number> {
  const withWts: Record<string, string | number> = { ...params, wts: nowSeconds };
  const query = Object.keys(withWts)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${rfc3986Encode(String(withWts[key]))}`)
    .join('&');
  const wRid = createHash('md5').update(query + mixinKey).digest('hex');
  return { ...withWts, w_rid: wRid };
}

function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}

function makeRawFetcher(options: BilibiliFetchOptions) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  return async (url: string): Promise<{ code: number; message: string; data?: unknown }> => {
    const response = await fetchImpl(url, {
      headers: {
        'User-Agent': UA,
        Referer: 'https://space.bilibili.com/',
        Accept: 'application/json',
        ...(options.cookie ? { Cookie: options.cookie } : {}),
      },
    });
    if (!response.ok) {
      if (response.status === 412 || response.status === 403) {
        throw new Error(
          'B站风控拦截（HTTP ' +
            response.status +
            '）：投稿列表接口需要登录 Cookie，请从浏览器复制后以 --cookie 传入；' +
            '仅拉粉丝数可用 --max-videos 0（匿名可访问）',
        );
      }
      throw new Error(`B站接口请求失败（HTTP ${response.status}）：${url}`);
    }
    const payload = (await response.json()) as { code: number; message: string; data?: unknown };
    if (payload.code === -352 || payload.code === -412) {
      throw new Error(
        'B站风控拦截（code ' +
          payload.code +
          '）：请稍后重试，或从浏览器复制 Cookie 后用 --cookie 传入',
      );
    }
    return payload;
  };
}

function makeFetcher(options: BilibiliFetchOptions) {
  const raw = makeRawFetcher(options);
  return async (url: string): Promise<unknown> => {
    const payload = await raw(url);
    if (payload.code !== 0) {
      throw new Error(`B站接口返回错误 code=${payload.code}：${payload.message}（${url}）`);
    }
    return payload.data;
  };
}

export async function fetchWbiKeys(options: BilibiliFetchOptions = {}): Promise<{ imgKey: string; subKey: string }> {
  const raw = makeRawFetcher(options);
  // 已知行为：匿名调用 nav 返回 code=-101（账号未登录），但 data.wbi_img 照常返回
  const payload = await raw(`${API_BASE}/x/web-interface/nav`);
  const data = (payload.data ?? {}) as { wbi_img?: { img_url?: string; sub_url?: string } };
  const imgKey = keyFromUrl(data.wbi_img?.img_url);
  const subKey = keyFromUrl(data.wbi_img?.sub_url);
  if (!imgKey || !subKey) {
    throw new Error(`无法获取 Wbi keys：nav 接口响应异常（code=${payload.code} ${payload.message}）`);
  }
  return { imgKey, subKey };
}

function keyFromUrl(url?: string): string | null {
  if (!url) return null;
  const filename = url.split('/').pop() || '';
  return filename.replace(/\.png$/, '') || null;
}

export async function fetchFollowerCount(mid: string, options: BilibiliFetchOptions = {}): Promise<number> {
  const get = makeFetcher(options);
  const data = (await get(`${API_BASE}/x/relation/stat?vmid=${encodeURIComponent(mid)}`)) as {
    follower?: number;
  };
  if (typeof data.follower !== 'number') throw new Error(`无法读取粉丝数：mid=${mid} 可能不存在`);
  return data.follower;
}

interface ArchivePage {
  list?: { vlist?: { bvid?: string; author?: string }[] };
  page?: { count?: number };
}

/** 拉全部投稿的 bvid（Wbi 签名分页），最多 maxVideos 条 */
export async function fetchArchiveBvids(
  mid: string,
  wbi: { imgKey: string; subKey: string },
  options: BilibiliFetchOptions & { maxVideos?: number } = {},
): Promise<{ bvids: string[]; author: string | null }> {
  const get = makeFetcher(options);
  const mixinKey = deriveMixinKey(wbi.imgKey, wbi.subKey);
  const maxVideos = options.maxVideos ?? 100;
  const pageSize = 30;
  const bvids: string[] = [];
  let author: string | null = null;

  for (let page = 1; bvids.length < maxVideos; page += 1) {
    const params = signWbiParams({ mid, pn: page, ps: pageSize, order: 'pubdate' }, mixinKey);
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const data = (await get(`${API_BASE}/x/space/wbi/arc/search?${query}`)) as ArchivePage;
    const vlist = data.list?.vlist ?? [];
    if (!author && vlist[0]?.author) author = vlist[0].author;
    for (const item of vlist) {
      if (item.bvid) bvids.push(item.bvid);
    }
    const total = data.page?.count ?? bvids.length;
    if (vlist.length < pageSize || bvids.length >= total) break;
  }
  return { bvids: bvids.slice(0, maxVideos), author };
}

interface VideoStat {
  view?: number;
  like?: number;
  reply?: number;
  share?: number;
}

export async function fetchVideoStat(bvid: string, options: BilibiliFetchOptions = {}): Promise<VideoStat> {
  const get = makeFetcher(options);
  const data = (await get(`${API_BASE}/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`)) as {
    stat?: VideoStat;
  };
  return data.stat ?? {};
}

/**
 * 并发抓取一批视频统计，每批后 throttle 一次以避免 B站风控。
 * 返回 Map<videoId, VideoStat>。调用方传入的 requestDelayMs 控制每批之间的间隔。
 */
async function fetchVideoStatsBatch(
  bvids: string[],
  options: BilibiliFetchOptions & { requestDelayMs?: number },
): Promise<Map<string, VideoStat>> {
  const stats = new Map<string, VideoStat>();
  const concurrency = options.videoConcurrency ?? 8;
  const delay = options.requestDelayMs ?? 300;
  for (let i = 0; i < bvids.length; i += concurrency) {
    const batch = bvids.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((b) => fetchVideoStat(b, options)));
    batch.forEach((b, idx) => stats.set(b, results[idx]));
    if (i + concurrency < bvids.length && delay > 0) await new Promise((r) => setTimeout(r, delay));
  }
  return stats;
}

export interface BilibiliSnapshot extends BilibiliTotals {
  author: string | null;
  follower: number;
  videoCount: number;
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

export interface BilibiliConnectorResult {
  channelId: string | null;
  follower: number;
  totals: BilibiliTotals | null;
  increments: Delta;
  baseline: boolean;
  author: string | null;
  videoCount: number;
}

export interface BilibiliConnectorOptions extends BilibiliFetchOptions {
  mid: string;
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

export interface BilibiliCollectOptions extends BilibiliFetchOptions {
  maxVideos?: number;
}

export async function collectBilibiliSnapshot(
  mid: string,
  options: BilibiliCollectOptions,
): Promise<{ follower: number; totals: BilibiliTotals | null; author: string | null; videoCount: number }> {
  const maxVideos = options.maxVideos ?? 100;
  // 粉丝数与 Wbi keys 无依赖，并发拉
  const [follower, wbi] = await Promise.all([
    fetchFollowerCount(mid, options),
    maxVideos === 0 ? Promise.resolve(null) : fetchWbiKeys(options),
  ]);
  if (maxVideos === 0) return { follower, totals: null, author: null, videoCount: 0 };

  const { bvids, author } = await fetchArchiveBvids(mid, wbi!, options);
  const stats = await fetchVideoStatsBatch(bvids, options);
  const totals: BilibiliTotals = { views: 0, likes: 0, comments: 0, shares: 0 };
  for (const bvid of bvids) {
    const stat = stats.get(bvid) ?? {};
    totals.views += stat.view ?? 0;
    totals.likes += stat.like ?? 0;
    totals.comments += stat.reply ?? 0;
    totals.shares += stat.share ?? 0;
  }
  return { follower, totals, author, videoCount: bvids.length };
}

export async function runBilibiliConnector(
  options: BilibiliConnectorOptions,
): Promise<BilibiliConnectorResult> {
  const result = await runBrandPipeline<{ author: string | null; videoCount: number }>({
    collect: () => collectBilibiliSnapshot(options.mid, options) as Promise<BrandFollowerSnapshot & { author: string | null; videoCount: number }>,
    resolveChannel: (client) =>
      client.resolveOrCreateChannel({
        explicitChannelId: options.explicitChannelId,
        platformPredicate: (c) => c.platform === 'bilibili',
        label: 'B站',
        create: { platform: 'bilibili', name: 'B站', handle: options.mid, positioning: null },
      }),
    note: ({ totals }, baseline) =>
      options.note ??
      `bilibili 连接器：${totals ? `${options.maxVideos ?? 100} 投稿累计` : '仅粉丝数（follower-only）'}（来源：公开接口）${baseline ? ' · 首次基线' : ''}`,
    stateDir: options.stateDir,
    stateName: options.stateName,
    client: options.client,
    explicitChannelId: options.explicitChannelId,
    dryRun: options.dryRun,
    loadState: options.loadState,
    saveState: options.saveState,
  });
  return {
    channelId: result.channelId,
    follower: result.follower,
    totals: (result.totals as BilibiliTotals | null) ?? null,
    increments: result.increments,
    baseline: result.baseline,
    author: (result.extras.author as string | null | undefined) ?? null,
    videoCount: ((result.extras.videoCount as number | undefined) ?? 0) || 0,
  };
}

