/* eslint-disable no-console */
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

/** 把 brand-seed-data.ts 的 mock 数据应用到指定用户（幂等）。
 *  先清掉该用户 id 以 seed-brand- 开头的旧 mock 行再按文件重建，文件是这批数据的唯一来源；
 *  用户在页面上自建的行（uuid id）不受影响。关联的 Topic 只创建、不更新（认知板块数据，可能挂有笔记）。 */
export async function seedBrandMockData(prisma: PrismaClient, userId: string) {
  await prisma.contentDistribution.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });
  await prisma.metricSnapshot.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });
  await prisma.contentItem.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });
  await prisma.platformChannel.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });
  await prisma.brandPillar.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });
  await prisma.work.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });
  await prisma.brandProfile.deleteMany({ where: { userId, id: { startsWith: SEED_PREFIX } } });

  const profile = await prisma.brandProfile.create({
    data: { id: `${SEED_PREFIX}profile`, userId, ...BRAND_MOCK_PROFILE },
  });

  const pillarIds = new Map<string, string>();
  for (const p of BRAND_MOCK_PILLARS) {
    const id = `${SEED_PREFIX}pillar-${p.key}`;
    await prisma.brandPillar.create({
      data: { id, userId, profileId: profile.id, name: p.name, description: p.description, order: p.order },
    });
    pillarIds.set(p.key, id);
  }

  const channelIds = new Map<string, string>();
  for (const c of BRAND_MOCK_CHANNELS) {
    const id = `${SEED_PREFIX}channel-${c.key}`;
    await prisma.platformChannel.create({
      data: {
        id,
        userId,
        platform: c.platform,
        name: c.name,
        handle: c.handle,
        url: c.url,
        positioning: c.positioning,
        cadence: c.cadence,
        status: c.status,
        order: c.order,
      },
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
    },
  });

  const contentIds = new Map<string, string>();
  for (const item of BRAND_MOCK_CONTENTS) {
    const id = `${SEED_PREFIX}content-${item.key}`;
    await prisma.contentItem.create({
      data: {
        id,
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
      },
    });
    contentIds.set(item.key, id);
  }

  for (const d of BRAND_MOCK_DISTRIBUTIONS) {
    await prisma.contentDistribution.create({
      data: {
        id: `${SEED_PREFIX}dist-${d.contentKey}-${d.channelKey}`,
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
      },
    });
  }

  for (const s of BRAND_MOCK_SNAPSHOTS) {
    await prisma.metricSnapshot.create({
      data: {
        id: `${SEED_PREFIX}snapshot-${s.channelKey}-${s.daysAgo}`,
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
      },
    });
  }

  for (const w of BRAND_MOCK_WORKS) {
    await prisma.work.create({
      data: {
        id: `${SEED_PREFIX}work-${w.key}`,
        userId,
        name: w.name,
        type: w.type,
        status: w.status,
        description: w.description,
        progress: w.progress,
        url: w.url,
        launchedAt: w.launchedDaysAgo != null ? daysAgo(w.launchedDaysAgo) : null,
        order: w.order,
      },
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
