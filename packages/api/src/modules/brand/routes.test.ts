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
});
