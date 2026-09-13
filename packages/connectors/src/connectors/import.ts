import { readFile } from 'node:fs/promises';
import type { BrandApiClient } from '../lib/brand-client.js';
import type { Delta } from '../lib/brand-types.js';
import {
  runBrandPipeline,
  type BrandFollowerSnapshot,
} from '../lib/brand-pipeline.js';

/**
 * 通用 JSON 导入连接器：用于无官方 API、亦不便写 Chrome 扩展的渠道
 * （公众号、视频号、小红书等封闭平台的创作者后台）。
 *
 * 用法：用户从创作者后台手动复制数据 → 整理成本地 JSON 文件 → 连接器读取后写入品牌快照。
 * 字段映射：followers 当前粉丝数；totals.views/likes/comments/shares 累计互动值。
 * 每次导入写 followers 累计；totals 按「与上次同来源（platform+handle）的累计差值」算本周期增量。
 *
 * 见 docs/实践/品牌/快照调度.md 「封闭平台手动采集」一节获取各平台的 JSON 模板。
 */

export interface ImportTotals {
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
}

export interface ImportPayload {
  platform: string;
  handle: string;
  displayName?: string;
  positioning?: string;
  followers: number;
  totals?: ImportTotals;
  note?: string;
}

export interface ImportTotalsNormalized {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface ImportSnapshot {
  platform: string;
  handle: string;
  follower: number;
  totals: ImportTotalsNormalized;
  note: string | undefined;
}

export interface ImportConnectorOptions {
  filePath: string;
  client?: BrandApiClient;
  explicitChannelId?: string;
  note?: string;
  dryRun?: boolean;
  stateDir: string;
  stateName: string;
  loadState: <T extends Record<string, unknown>>(dir: string, name: string, fallback: T) => Promise<T>;
  saveState: (dir: string, name: string, state: Record<string, unknown>) => Promise<void>;
}

export interface ImportConnectorResult {
  channelId: string | null;
  follower: number;
  totals: ImportTotalsNormalized | null;
  increments: Delta;
  baseline: boolean;
  platform: string;
  handle: string;
}

function normalize(payload: ImportPayload): ImportSnapshot {
  return {
    platform: payload.platform,
    handle: payload.handle,
    follower: payload.followers,
    totals: {
      views: payload.totals?.views ?? 0,
      likes: payload.totals?.likes ?? 0,
      comments: payload.totals?.comments ?? 0,
      shares: payload.totals?.shares ?? 0,
    },
    note: payload.note,
  };
}

export async function loadImportPayload(filePath: string): Promise<ImportPayload> {
  const raw = await readFile(filePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`无法解析 ${filePath}：${error instanceof Error ? error.message : String(error)}（请确认是合法 JSON）`);
  }
  const payload = parsed as Partial<ImportPayload>;
  if (typeof payload.platform !== 'string' || !payload.platform) {
    throw new Error(`${filePath} 缺少 platform（应为 wechat-mp / wechat-channels / xiaohongshu / custom）`);
  }
  if (typeof payload.handle !== 'string' || !payload.handle) {
    throw new Error(`${filePath} 缺少 handle（用于匹配/创建品牌渠道）`);
  }
  if (typeof payload.followers !== 'number' || !Number.isFinite(payload.followers)) {
    throw new Error(`${filePath} 缺少或非数字的 followers`);
  }
  return payload as ImportPayload;
}

export async function runImportConnector(options: ImportConnectorOptions): Promise<ImportConnectorResult> {
  const snapshot = normalize(await loadImportPayload(options.filePath));
  // 跨文件/多次导出共享同一基线：用 platform+handle 派生 stateName（覆盖 CLI 传进来的文件名版）
  const stateName = `brand-import-${snapshot.platform}-${snapshot.handle}`.replace(/[^A-Za-z0-9-_]/g, '_');
  const result = await runBrandPipeline<{ platform: string; handle: string }>({
    collect: async () =>
      ({
        follower: snapshot.follower,
        totals: snapshot.totals,
        platform: snapshot.platform,
        handle: snapshot.handle,
      }) as BrandFollowerSnapshot & { platform: string; handle: string },
    resolveChannel: (client) =>
      client.resolveOrCreateChannel({
        explicitChannelId: options.explicitChannelId,
        platformPredicate: (c) => c.platform === snapshot.platform,
        label: snapshot.platform,
        create: {
          platform: snapshot.platform,
          name: snapshot.platform,
          handle: snapshot.handle,
          positioning: null,
        },
      }),
    note: (_s, baseline) =>
      options.note ||
      snapshot.note ||
      `import 连接器：${snapshot.platform}（来源：手动 JSON）${baseline ? ' · 首次基线' : ''}`,
    stateDir: options.stateDir,
    stateName,
    client: options.client,
    explicitChannelId: options.explicitChannelId,
    dryRun: options.dryRun,
    loadState: options.loadState,
    saveState: options.saveState,
  });
  return {
    channelId: result.channelId,
    follower: result.follower,
    totals: (result.totals as ImportTotalsNormalized | null) ?? null,
    increments: result.increments,
    baseline: result.baseline,
    platform: (result.extras.platform as string | undefined) ?? '',
    handle: (result.extras.handle as string | undefined) ?? '',
  };
}
