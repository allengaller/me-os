import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeDelta } from '../lib/brand-types.js';
import {
  loadImportPayload,
  runImportConnector,
} from './import.js';
import type { BrandApiClient } from '../lib/brand-client.js';

const SAMPLE = {
  platform: 'wechat-mp',
  handle: 'allengaller',
  displayName: '公众号主号',
  positioning: '图文沉淀——方法论长文',
  followers: 720,
  totals: { views: 9200, likes: 460, comments: 90, shares: 310 },
  note: '公众号后台 2026-09-12 复盘',
};

describe('import 连接器', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'brand-import-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('loadImportPayload 拒绝非法 JSON', async () => {
    const path = join(dir, 'bad.json');
    writeFileSync(path, '{ platform: 1 }');
    await expect(loadImportPayload(path)).rejects.toThrow(/无法解析/);
  });

  it('loadImportPayload 校验必填字段 platform/handle/followers', async () => {
    const cases = [
      { platform: 'wechat-mp', handle: 'x', followers: '100' }, // followers 非数字
      { handle: 'x', followers: 100 }, // 缺 platform
      { platform: 'wechat-mp', followers: 100 }, // 缺 handle
    ];
    for (const [i, c] of cases.entries()) {
      writeFileSync(join(dir, `case-${i}.json`), JSON.stringify(c));
      await expect(loadImportPayload(join(dir, `case-${i}.json`))).rejects.toThrow();
    }
  });

  it('computeDelta 首次为 null；非首次按累计差值', () => {
    expect(computeDelta({ views: 100, likes: 10, comments: 5, shares: 2 })).toEqual({
      views: null,
      likes: null,
      comments: null,
      shares: null,
    });
    expect(
      computeDelta(
        { views: 150, likes: 12, comments: 7, shares: 3 },
        { views: 100, likes: 10, comments: 5, shares: 2 },
      ),
    ).toEqual({ views: 50, likes: 2, comments: 2, shares: 1 });
  });

  it('首次运行写基线快照并保存游标', async () => {
    const filePath = join(dir, 'sample.json');
    writeFileSync(filePath, JSON.stringify(SAMPLE));
    const client = {
      listChannels: vi.fn(async () => []),
      createChannel: vi.fn(async () => ({ id: 'ch-new', platform: SAMPLE.platform, name: SAMPLE.displayName })),
      postSnapshot: vi.fn(async () => undefined),
      resolveOrCreateChannel: vi.fn(async () => 'ch-new'),
    } as unknown as BrandApiClient;
    const store: Record<string, Record<string, unknown>> = {};
    const result = await runImportConnector({
      filePath,
      client,
      stateDir: dir,
      stateName: 'brand-import-wechat-mp-allengaller',
      loadState: async (_d, n, f) => ({ ...f, ...(store[n] || {}) }),
      saveState: async (_d, n, s) => {
        store[n] = s;
      },
    });
    expect(result.baseline).toBe(true);
    expect(result.channelId).toBe('ch-new');
    expect(client.resolveOrCreateChannel).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'wechat-mp', create: expect.objectContaining({ platform: 'wechat-mp', handle: 'allengaller' }) }),
    );
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'ch-new',
        followers: 720,
        views: null,
        likes: null,
        comments: null,
        shares: null,
      }),
    );
    expect(store['brand-import-wechat-mp-allengaller'].lastTotals).toEqual({ views: 9200, likes: 460, comments: 90, shares: 310 });
  });

  it('第二次运行按累计差值写入增量', async () => {
    const filePath = join(dir, 'sample2.json');
    writeFileSync(filePath, JSON.stringify({ ...SAMPLE, followers: 745, totals: { views: 9400, likes: 470, comments: 92, shares: 315 } }));
    const client = {
      listChannels: vi.fn(async () => [{ id: 'ch-new', platform: 'wechat-mp', name: '公众号主号' }]),
      createChannel: vi.fn(),
      postSnapshot: vi.fn(async () => undefined),
      resolveOrCreateChannel: vi.fn(async () => 'ch-new'),
    } as unknown as BrandApiClient;
    const store: Record<string, Record<string, unknown>> = {
      'brand-import-wechat-mp-allengaller': { lastTotals: { views: 9200, likes: 460, comments: 90, shares: 310 } },
    };
    const result = await runImportConnector({
      filePath,
      client,
      stateDir: dir,
      stateName: 'brand-import-wechat-mp-allengaller',
      loadState: async (_d, n, f) => ({ ...f, ...(store[n] || {}) }),
      saveState: async (_d, n, s) => {
        store[n] = s;
      },
    });
    expect(result.baseline).toBe(false);
    expect(client.postSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ followers: 745, views: 200, likes: 10, comments: 2, shares: 5 }),
    );
  });

  it('dry-run 不写 MeOS、不存游标', async () => {
    const filePath = join(dir, 'sample.json');
    writeFileSync(filePath, JSON.stringify(SAMPLE));
    const client = {
      listChannels: vi.fn(),
      createChannel: vi.fn(),
      postSnapshot: vi.fn(),
    } as unknown as BrandApiClient;
    const result = await runImportConnector({
      filePath,
      client,
      dryRun: true,
      stateDir: dir,
      stateName: 'brand-import-wechat-mp-allengaller',
      loadState: async (_d, _n, f) => f,
      saveState: vi.fn(),
    });
    expect(client.postSnapshot).not.toHaveBeenCalled();
    expect(result.follower).toBe(720);
  });
});