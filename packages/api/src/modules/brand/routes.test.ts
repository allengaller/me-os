import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildTestApp } from '../../test-utils.js';
import { brandRoutes } from './routes.js';

const prisma = new PrismaClient();
const USER_ID = 'brand-test-user';

async function cleanupUserData() {
  await prisma.metricSnapshot.deleteMany({ where: { userId: USER_ID } });
  await prisma.contentDistribution.deleteMany({ where: { userId: USER_ID } });
  await prisma.contentItem.deleteMany({ where: { userId: USER_ID } });
  await prisma.platformChannel.deleteMany({ where: { userId: USER_ID } });
  await prisma.brandPillar.deleteMany({ where: { userId: USER_ID } });
  await prisma.brandProfile.deleteMany({ where: { userId: USER_ID } });
  await prisma.work.deleteMany({ where: { userId: USER_ID } });
}

async function cleanupAll() {
  await cleanupUserData();
  await prisma.user.deleteMany({ where: { id: USER_ID } });
}

describe('Brand Routes', () => {
  beforeAll(async () => {
    await cleanupAll();
    await prisma.user.create({
      data: { id: USER_ID, email: 'brand-test@example.com', password: 'hashed', name: 'Brand Test' },
    });
  });

  beforeEach(async () => {
    await cleanupUserData();
  });

  afterAll(async () => {
    await cleanupAll();
    await prisma.$disconnect();
  });

  async function createApp(userId: string = USER_ID) {
    const app = await buildTestApp({ userId });
    await app.register(brandRoutes, { prefix: '/api/brand' });
    await app.ready();
    return app;
  }

  describe('品牌档案', () => {
    it('GET /profile 无记录时返回空壳', async () => {
      const app = await createApp();
      const res = await app.inject({ method: 'GET', url: '/api/brand/profile' });
      expect(res.statusCode).toBe(200);
      expect(res.json().profile.slogan).toBeNull();
      expect(res.json().profile.mission).toBeNull();
    });

    it('PUT /profile upsert：创建后再更新仍是单条', async () => {
      const app = await createApp();
      const first = await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: '用系统经营人生' },
      });
      expect(first.statusCode).toBe(200);
      expect(first.json().profile.slogan).toBe('用系统经营人生');

      const second = await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: '曹亚仑：人生系统构建者', mission: '帮创业者用系统经营人生' },
      });
      expect(second.json().profile.slogan).toBe('曹亚仑：人生系统构建者');

      const list = await prisma.brandProfile.findMany({ where: { userId: USER_ID } });
      expect(list).toHaveLength(1);
      expect(list[0].mission).toBe('帮创业者用系统经营人生');
    });

    it('PUT /profile 非法字段返回 400', async () => {
      const app = await createApp();
      const res = await app.inject({
        method: 'PUT',
        url: '/api/brand/profile',
        payload: { slogan: 123 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('内容支柱', () => {
    it('创建、列表、删除支柱', async () => {
      const app = await createApp();
      const created = await app.inject({
        method: 'POST',
        url: '/api/brand/pillars',
        payload: { name: '人生管理系统' },
      });
      expect(created.statusCode).toBe(201);
      const id = created.json().pillar.id;

      const list = await app.inject({ method: 'GET', url: '/api/brand/pillars' });
      expect(list.json().pillars).toHaveLength(1);
      expect(list.json().pillars[0].name).toBe('人生管理系统');

      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/pillars/${id}` });
      expect(removed.json().success).toBe(true);
    });

    it('同名支柱返回 400', async () => {
      const app = await createApp();
      await app.inject({ method: 'POST', url: '/api/brand/pillars', payload: { name: 'AI 工作流' } });
      const dup = await app.inject({ method: 'POST', url: '/api/brand/pillars', payload: { name: 'AI 工作流' } });
      expect(dup.statusCode).toBe(400);
    });
  });

  describe('渠道与快照', () => {
    it('创建渠道并录入两个快照', async () => {
      const app = await createApp();
      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'wechat-mp', name: '公众号', handle: 'caoyalun', cadence: '每周 1 篇' },
      });
      expect(channel.statusCode).toBe(201);
      const channelId = channel.json().channel.id;

      const s1 = await app.inject({
        method: 'POST',
        url: '/api/brand/snapshots',
        payload: { channelId, followers: 100 },
      });
      expect(s1.statusCode).toBe(201);

      const s2 = await app.inject({
        method: 'POST',
        url: '/api/brand/snapshots',
        payload: { channelId, followers: 150, views: 500, likes: 60, revenue: 12.5 },
      });
      expect(s2.statusCode).toBe(201);

      const list = await app.inject({
        method: 'GET',
        url: `/api/brand/snapshots?channelId=${channelId}`,
      });
      expect(list.json().snapshots).toHaveLength(2);
      expect(list.json().snapshots[0].followers).toBe(150); // 按 recordedAt 倒序
    });

    it('快照必须归属当前用户的渠道', async () => {
      const app = await createApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/brand/snapshots',
        payload: { channelId: 'nonexistent', followers: 10 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('同平台同名渠道冲突返回 400', async () => {
      const app = await createApp();
      await app.inject({ method: 'POST', url: '/api/brand/channels', payload: { platform: 'x', name: 'X 主号' } });
      const dup = await app.inject({ method: 'POST', url: '/api/brand/channels', payload: { platform: 'x', name: 'X 主号' } });
      expect(dup.statusCode).toBe(400);
    });

    it('更新与删除渠道', async () => {
      const app = await createApp();
      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'xiaohongshu', name: '小红书' },
      });
      const id = channel.json().channel.id;
      const patched = await app.inject({
        method: 'PATCH',
        url: `/api/brand/channels/${id}`,
        payload: { status: 'paused' },
      });
      expect(patched.json().channel.status).toBe('paused');
      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/channels/${id}` });
      expect(removed.json().success).toBe(true);
    });
  });

  describe('内容与分发', () => {
    async function seedChannel(app: Awaited<ReturnType<typeof createApp>>) {
      const channel = await app.inject({
        method: 'POST',
        url: '/api/brand/channels',
        payload: { platform: 'wechat-mp', name: '公众号' },
      });
      return channel.json().channel.id as string;
    }

    it('内容 CRUD 与状态筛选', async () => {
      const app = await createApp();
      await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: '五维度框架解读', status: 'drafting' } });
      const idea = await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: 'MeLog 发布宣言' } });
      expect(idea.statusCode).toBe(201);
      const ideaId = idea.json().content.id;

      const drafting = await app.inject({ method: 'GET', url: '/api/brand/contents?status=drafting' });
      expect(drafting.json().contents).toHaveLength(1);
      expect(drafting.json().contents[0].title).toBe('五维度框架解读');

      const search = await app.inject({ method: 'GET', url: '/api/brand/contents?q=MeLog' });
      expect(search.json().contents).toHaveLength(1);

      const patched = await app.inject({
        method: 'PATCH',
        url: `/api/brand/contents/${ideaId}`,
        payload: { priority: 'high', coreMessage: '生活数据应该汇聚而不是散落' },
      });
      expect(patched.json().content.priority).toBe('high');

      const removed = await app.inject({ method: 'DELETE', url: `/api/brand/contents/${ideaId}` });
      expect(removed.json().success).toBe(true);
    });

    it('pillarId 不属于当前用户时返回 400', async () => {
      const app = await createApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: 'T', pillarId: 'nonexistent' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('发布分发自动完成内容', async () => {
      const app = await createApp();
      const channelId = await seedChannel(app);
      const content = await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: '人生操作系统', status: 'ready' },
      });
      const contentId = content.json().content.id;

      const dist = await app.inject({
        method: 'POST',
        url: `/api/brand/contents/${contentId}/distributions`,
        payload: { channelId, adaptedTitle: '我为什么做 MeOS' },
      });
      expect(dist.statusCode).toBe(201);
      const distId = dist.json().distribution.id;

      const published = await app.inject({
        method: 'PATCH',
        url: `/api/brand/distributions/${distId}`,
        payload: { status: 'published', url: 'https://mp.weixin.qq.com/s/xxx', views: 1200, likes: 88 },
      });
      expect(published.json().distribution.status).toBe('published');
      expect(published.json().distribution.publishedAt).not.toBeNull();

      const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
      expect(item!.status).toBe('published');
      expect(item!.publishedAt).not.toBeNull();
    });

    it('归档内容不被发布自动化改写', async () => {
      const app = await createApp();
      const channelId = await seedChannel(app);
      const content = await app.inject({
        method: 'POST',
        url: '/api/brand/contents',
        payload: { title: '旧稿', status: 'archived' },
      });
      const contentId = content.json().content.id;
      const dist = await app.inject({
        method: 'POST',
        url: `/api/brand/contents/${contentId}/distributions`,
        payload: { channelId },
      });
      await app.inject({
        method: 'PATCH',
        url: `/api/brand/distributions/${dist.json().distribution.id}`,
        payload: { status: 'published' },
      });
      const item = await prisma.contentItem.findUnique({ where: { id: contentId } });
      expect(item!.status).toBe('archived');
      expect(item!.publishedAt).toBeNull();
    });

    it('同内容同渠道重复添加返回 400', async () => {
      const app = await createApp();
      const channelId = await seedChannel(app);
      const content = await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: 'T' } });
      const contentId = content.json().content.id;
      await app.inject({ method: 'POST', url: `/api/brand/contents/${contentId}/distributions`, payload: { channelId } });
      const dup = await app.inject({ method: 'POST', url: `/api/brand/contents/${contentId}/distributions`, payload: { channelId } });
      expect(dup.statusCode).toBe(400);
    });

    it('跨用户访问返回 404', async () => {
      const app = await createApp();
      const content = await app.inject({ method: 'POST', url: '/api/brand/contents', payload: { title: '我的内容' } });
      const contentId = content.json().content.id;

      const otherApp = await createApp('brand-other-user');
      const res = await otherApp.inject({ method: 'GET', url: `/api/brand/contents/${contentId}` });
      expect(res.statusCode).toBe(404);
    });
  });
});
