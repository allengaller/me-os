/* eslint-disable no-console */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDelegate = any;
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  BRAND_MOCK_PROFILE,
  BRAND_MOCK_PILLARS,
  BRAND_MOCK_CHANNELS,
  BRAND_MOCK_SNAPSHOTS,
  BRAND_MOCK_CONTENTS,
  BRAND_MOCK_DISTRIBUTIONS,
  BRAND_MOCK_WORKS,
  BRAND_MOCK_TOPIC,
} from './brand-seed-data.js';

// 开发认证旁路固定身份（见 src/server.ts：request.user = { userId: 'mock-user-1' }）
export const BRAND_MOCK_USER_ID = 'mock-user-1';
const SEED_PREFIX = 'seed-brand-';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000);
const inDays = (n: number) => new Date(Date.now() + n * 24 * 3600 * 1000);

/** 确保 mock-user-1 真实存在于 User 表。
 *  dev 模式下所有请求都以该身份访问，若 User 行缺失，任何写库操作都会因外键约束（P2003）失败。 */
export async function ensureBrandMockUser(prisma: PrismaClient) {
  const hashed = await bcrypt.hash('demo123456', 10);
  await prisma.user.upsert({
    where: { id: BRAND_MOCK_USER_ID },
    update: {},
    create: { id: BRAND_MOCK_USER_ID, email: 'mock-user-1@meos.dev', password: hashed, name: 'Dev Mock User' },
  });
}

/** mock 行的幂等写入（seed 脚本专用，model 传 prisma.<delegate>）：
 *  - 行不存在 → 以 isMock: true 创建；
 *  - 行存在且 isMock: true → 按 seed 文件刷新（文件是 mock 行的唯一来源）；
 *  - 行存在但 isMock: false → 已被用户认领，跳过，页面上的改动保留。 */
async function upsertMockRow(model: AnyDelegate, id: string, data: Record<string, unknown>) {
  const existing = await model.findUnique({ where: { id } });
  if (existing && !existing.isMock) return;
  if (existing) {
    await model.update({ where: { id }, data: { ...data, isMock: true } });
    return;
  }
  await model.create({ data: { id, isMock: true, ...data } });
}

/** 清掉不在 seed 文件里的旧 mock 行（isMock: true 且 id 不在本次集合中）。已认领行（isMock: false）不受影响。 */
async function pruneMockRows(model: AnyDelegate, userId: string, keepIds: string[]) {
  await model.deleteMany({ where: { userId, isMock: true, id: { notIn: keepIds } } });
}

/** 把 brand-seed-data.ts 的 mock 数据应用到指定用户（幂等）。
 *  mock 行以 isMock: true 标记，页面显示 mock 徽标；用户认领（isMock: false）后本脚本不再覆盖。
 *  用户自建的行（uuid id、isMock: false）始终不受影响。
 *  关联的 Topic 只创建、不更新（认知板块数据，可能挂有笔记）。 */
export async function seedBrandMockData(prisma: PrismaClient, userId: string) {
  await pruneMockRows(prisma.contentDistribution, userId, BRAND_MOCK_DISTRIBUTIONS.map(
    (d) => `${SEED_PREFIX}dist-${d.contentKey}-${d.channelKey}`,
  ));
  await pruneMockRows(prisma.metricSnapshot, userId, BRAND_MOCK_SNAPSHOTS.map(
    (s) => `${SEED_PREFIX}snapshot-${s.channelKey}-${s.daysAgo}`,
  ));
  await pruneMockRows(prisma.contentItem, userId, BRAND_MOCK_CONTENTS.map(
    (c) => `${SEED_PREFIX}content-${c.key}`,
  ));
  await pruneMockRows(prisma.platformChannel, userId, BRAND_MOCK_CHANNELS.map(
    (c) => `${SEED_PREFIX}channel-${c.key}`,
  ));
  await pruneMockRows(prisma.brandPillar, userId, BRAND_MOCK_PILLARS.map(
    (p) => `${SEED_PREFIX}pillar-${p.key}`,
  ));
  await pruneMockRows(prisma.work, userId, BRAND_MOCK_WORKS.map(
    (w) => `${SEED_PREFIX}work-${w.key}`,
  ));

  // 品牌档案：userId 唯一。若用户已自建档案（非 mock 的固定 id 行），不再写入 mock 档案，支柱挂到现有档案下。
  const fixedProfileId = `${SEED_PREFIX}profile`;
  let profileId = fixedProfileId;
  const fixedProfile = await prisma.brandProfile.findUnique({ where: { id: fixedProfileId } });
  const userProfile = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!fixedProfile?.isMock && userProfile && userProfile.id !== fixedProfileId) {
    profileId = userProfile.id;
  } else {
    await upsertMockRow(prisma.brandProfile, fixedProfileId, { userId, ...BRAND_MOCK_PROFILE });
  }

  const pillarIds = new Map<string, string>();
  for (const p of BRAND_MOCK_PILLARS) {
    const id = `${SEED_PREFIX}pillar-${p.key}`;
    await upsertMockRow(prisma.brandPillar, id, {
      userId,
      profileId,
      name: p.name,
      description: p.description,
      order: p.order,
    });
    pillarIds.set(p.key, id);
  }

  const channelIds = new Map<string, string>();
  for (const c of BRAND_MOCK_CHANNELS) {
    const id = `${SEED_PREFIX}channel-${c.key}`;
    await upsertMockRow(prisma.platformChannel, id, {
      userId,
      platform: c.platform,
      name: c.name,
      handle: c.handle,
      url: c.url,
      positioning: c.positioning,
      cadence: c.cadence,
      status: c.status,
      order: c.order,
    });
    channelIds.set(c.key, id);
  }

  await prisma.topic.upsert({
    where: { id: BRAND_MOCK_TOPIC.id },
    update: {},
    create: {
      id: BRAND_MOCK_TOPIC.id,
      userId,
      title: BRAND_MOCK_TOPIC.title,
      description: BRAND_MOCK_TOPIC.description,
      category: BRAND_MOCK_TOPIC.category,
      status: BRAND_MOCK_TOPIC.status,
      priority: BRAND_MOCK_TOPIC.priority,
      isMock: true,
    },
  });

  const contentIds = new Map<string, string>();
  for (const item of BRAND_MOCK_CONTENTS) {
    const id = `${SEED_PREFIX}content-${item.key}`;
    await upsertMockRow(prisma.contentItem, id, {
      userId,
      title: item.title,
      type: item.type,
      status: item.status,
      coreMessage: item.coreMessage,
      outline: item.outline,
      priority: item.priority,
      tags: item.tags,
      pillarId: item.pillarKey ? (pillarIds.get(item.pillarKey) ?? null) : null,
      topicId: item.topicSeedId,
      reviewNote: item.reviewNote,
      publishedAt: item.publishedDaysAgo != null ? daysAgo(item.publishedDaysAgo) : null,
      publishDue: item.publishDueInDays != null ? inDays(item.publishDueInDays) : null,
      order: item.order,
    });
    contentIds.set(item.key, id);
  }

  for (const d of BRAND_MOCK_DISTRIBUTIONS) {
    await upsertMockRow(prisma.contentDistribution, `${SEED_PREFIX}dist-${d.contentKey}-${d.channelKey}`, {
      userId,
      contentId: contentIds.get(d.contentKey)!,
      channelId: channelIds.get(d.channelKey)!,
      status: d.status,
      adaptedTitle: d.adaptedTitle,
      url: null,
      publishedAt: d.publishedDaysAgo != null ? daysAgo(d.publishedDaysAgo) : null,
      views: d.views,
      likes: d.likes,
      comments: d.comments,
      shares: d.shares,
      note: d.note,
    });
  }

  for (const s of BRAND_MOCK_SNAPSHOTS) {
    await upsertMockRow(prisma.metricSnapshot, `${SEED_PREFIX}snapshot-${s.channelKey}-${s.daysAgo}`, {
      userId,
      channelId: channelIds.get(s.channelKey)!,
      followers: s.followers,
      views: s.views ?? null,
      likes: s.likes ?? null,
      comments: s.comments ?? null,
      shares: s.shares ?? null,
      revenue: s.revenue ?? null,
      note: s.note ?? null,
      recordedAt: daysAgo(s.daysAgo),
    });
  }

  for (const w of BRAND_MOCK_WORKS) {
    await upsertMockRow(prisma.work, `${SEED_PREFIX}work-${w.key}`, {
      userId,
      name: w.name,
      type: w.type,
      status: w.status,
      description: w.description,
      progress: w.progress,
      url: w.url,
      launchedAt: w.launchedDaysAgo != null ? daysAgo(w.launchedDaysAgo) : null,
      order: w.order,
    });
  }
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding brand mock data...');
  await ensureBrandMockUser(prisma);
  await seedBrandMockData(prisma, BRAND_MOCK_USER_ID);
  console.log(`✅ Brand mock data applied for user: ${BRAND_MOCK_USER_ID}`);
  console.log(`   （${BRAND_MOCK_PILLARS.length} 支柱 / ${BRAND_MOCK_CHANNELS.length} 渠道 / ${BRAND_MOCK_CONTENTS.length} 内容 / ${BRAND_MOCK_WORKS.length} 作品，数据源：src/prisma/brand-seed-data.ts）`);
  console.log('   重新应用：pnpm --filter @meos/api db:seed:brand');
}

main()
  .catch((e) => {
    console.error('❌ Brand seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
