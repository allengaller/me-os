import type { BrandApiClient } from './brand-client.js';
import { computeDelta, type Delta, type Totals } from './brand-types.js';

/**
 * 品牌快照通用流水线：collect → loadState → diff → resolveChannel → postSnapshot → saveState。
 * 所有 brand-* connector 共用；connectors 只负责 collect（拉数）+ resolveChannel（自动匹配/创建）。
 */

export interface BrandFollowerSnapshot {
  /** 当前粉丝累计值 */
  follower: number;
  /** 各平台累计互动指标；follower-only 模式（如 brand-bilibili --max-videos 0）传 null */
  totals: Totals | null;
}

/** connectors 在 collect 返回值里可附带的额外字段（author / videoCount / fullName 等），透传回调用方 */
export type BrandExtras = Record<string, unknown>;

export interface BrandPipelineOptions<TExtras extends BrandExtras = BrandExtras> {
  collect: () => Promise<BrandFollowerSnapshot & TExtras>;
  /** 自动匹配/创建品牌渠道；返回 channelId。pipeline 始终会调用 */
  resolveChannel: (client: BrandApiClient) => Promise<string>;
  /** 写入 MeOS 快照的 note 模板 */
  note: (snapshot: BrandFollowerSnapshot, baseline: boolean) => string;
  stateDir: string;
  stateName: string;
  client?: BrandApiClient;
  /** 外部明确指定渠道（CLI --channel-id）；此时跳过 resolveChannel */
  explicitChannelId?: string;
  dryRun?: boolean;
  loadState: <T extends Record<string, unknown>>(dir: string, name: string, fallback: T) => Promise<T>;
  saveState: (dir: string, name: string, state: Record<string, unknown>) => Promise<void>;
}

export interface BrandPipelineResult<TExtras extends BrandExtras = BrandExtras> {
  channelId: string | null;
  follower: number;
  totals: Totals | null;
  increments: Delta;
  baseline: boolean;
  extras: TExtras;
}

export async function runBrandPipeline<TExtras extends BrandExtras = BrandExtras>(
  options: BrandPipelineOptions<TExtras>
): Promise<BrandPipelineResult<TExtras>> {
  const { follower, totals, ...extras } = await options.collect();
  const state = await options.loadState<Record<string, unknown>>(options.stateDir, options.stateName, {});
  const previous = state.lastTotals as Totals | undefined;
  const increments = computeDelta(totals, previous);
  const baseline = !previous;

  const result: BrandPipelineResult<TExtras> = {
    channelId: options.explicitChannelId ?? null,
    follower,
    totals,
    increments,
    baseline,
    extras: extras as unknown as TExtras,
  };

  if (options.dryRun || !options.client) return result;

  const channelId = options.explicitChannelId ?? (await options.resolveChannel(options.client));
  await options.client.postSnapshot({
    channelId,
    followers: follower,
    views: increments.views,
    likes: increments.likes,
    comments: increments.comments,
    shares: increments.shares,
    note: options.note({ follower, totals }, baseline),
  });
  if (totals) {
    await options.saveState(options.stateDir, options.stateName, {
      lastRunAt: new Date().toISOString(),
      lastTotals: totals,
    });
  }
  return { ...result, channelId };
}