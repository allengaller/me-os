import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildTestApp } from '../../test-utils.js';
import { reflectionRoutes } from './routes.js';

const prisma = new PrismaClient();

async function cleanup() {
  await prisma.healthRecord.deleteMany({ where: { userId: 'reflection-test-user' } });
  await prisma.habitLog.deleteMany({ where: { habit: { userId: 'reflection-test-user' } } });
  await prisma.habit.deleteMany({ where: { userId: 'reflection-test-user' } });
  await prisma.todo.deleteMany({ where: { userId: 'reflection-test-user' } });
  await prisma.reflection.deleteMany({ where: { userId: 'reflection-test-user' } });
  await prisma.user.deleteMany({ where: { id: 'reflection-test-user' } });
}

describe('Reflection Routes', () => {
  beforeAll(async () => {
    await cleanup();
    await prisma.user.create({
      data: {
        id: 'reflection-test-user',
        email: 'reflection-test@example.com',
        password: 'hashed',
        name: 'Reflection Test',
      },
    });
  });

  beforeEach(async () => {
    await prisma.healthRecord.deleteMany({ where: { userId: 'reflection-test-user' } });
    await prisma.habitLog.deleteMany({ where: { habit: { userId: 'reflection-test-user' } } });
    await prisma.habit.deleteMany({ where: { userId: 'reflection-test-user' } });
    await prisma.todo.deleteMany({ where: { userId: 'reflection-test-user' } });
    await prisma.reflection.deleteMany({ where: { userId: 'reflection-test-user' } });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function createApp() {
    const app = await buildTestApp({ userId: 'reflection-test-user' });
    await app.register(reflectionRoutes, { prefix: '/api/reflections' });
    return app;
  }

  it('should create a daily reflection', async () => {
    const app = await createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/reflections',
      payload: {
        celebrations: ['完成了一项重要任务'],
        improvements: ['需要更早睡觉'],
        tomorrow: '明天开始运动',
        mood: '开心',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.reflection.celebrations).toBe('["完成了一项重要任务"]');
    expect(body.reflection.type).toBe('daily');
  });

  it('should list reflections with pagination', async () => {
    await prisma.reflection.create({
      data: {
        userId: 'reflection-test-user',
        date: new Date(),
        type: 'daily',
        celebrations: '[]',
        improvements: '[]',
      },
    });

    const app = await createApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/reflections?type=daily',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.reflections).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it('should get a reflection by id', async () => {
    const reflection = await prisma.reflection.create({
      data: {
        userId: 'reflection-test-user',
        date: new Date(),
        type: 'daily',
        celebrations: '[]',
        improvements: '[]',
        content: '今天的反思内容',
      },
    });

    const app = await createApp();
    const response = await app.inject({
      method: 'GET',
      url: `/api/reflections/${reflection.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().reflection.content).toBe('今天的反思内容');
  });

  it('should update a reflection', async () => {
    const reflection = await prisma.reflection.create({
      data: {
        userId: 'reflection-test-user',
        date: new Date(),
        type: 'daily',
        celebrations: '[]',
        improvements: '[]',
      },
    });

    const app = await createApp();
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/reflections/${reflection.id}`,
      payload: { content: '更新后的内容' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().reflection.content).toBe('更新后的内容');
  });

  it('should delete a reflection', async () => {
    const reflection = await prisma.reflection.create({
      data: {
        userId: 'reflection-test-user',
        date: new Date(),
        type: 'daily',
        celebrations: '[]',
        improvements: '[]',
      },
    });

    const app = await createApp();
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/reflections/${reflection.id}`,
    });

    expect(response.statusCode).toBe(200);
    const deleted = await prisma.reflection.findUnique({ where: { id: reflection.id } });
    expect(deleted).toBeNull();
  });

  it('should aggregate today data for reflection prefill', async () => {
    const now = new Date();
    const habit = await prisma.habit.create({
      data: { userId: 'reflection-test-user', title: '晨跑' },
    });
    await prisma.habitLog.create({ data: { habitId: habit.id, date: now } });
    await prisma.todo.create({
      data: { userId: 'reflection-test-user', title: '写周报', status: 'done', completedAt: now },
    });
    await prisma.healthRecord.create({
      data: {
        userId: 'reflection-test-user',
        type: 'sleep',
        value: 7.5,
        unit: 'hours',
        recordedAt: now,
      },
    });

    const app = await createApp();
    const response = await app.inject({ method: 'GET', url: '/api/reflections/today-summary' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.todos).toMatchObject({ total: 1, createdToday: 1 });
    expect(body.habits.total).toBe(1);
    expect(body.habits.items).toContain('晨跑');
    expect(body.health.total).toBe(1);
    expect(body.health.items[0].label).toBe('睡眠 7.5 小时');
    expect(body.summary).toContain('待办完成 1 条');
    expect(body.summary).toContain('习惯打卡 1 项');
    expect(body.summary).toContain('健康记录 1 条');
  });

  it('should skip data from other days in today-summary', async () => {
    const { start } = (() => {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      return { start: s };
    })();
    const yesterday = new Date(start);
    yesterday.setDate(yesterday.getDate() - 1);
    await prisma.todo.create({
      data: { userId: 'reflection-test-user', title: '昨天完成的事', status: 'done', completedAt: yesterday },
    });

    const app = await createApp();
    const response = await app.inject({ method: 'GET', url: '/api/reflections/today-summary' });
    expect(response.json().todos.total).toBe(0);
    expect(response.json().summary).toBe('');
  });

  it('should accept an explicit date and reject malformed ones', async () => {
    const app = await createApp();
    const bad = await app.inject({ method: 'GET', url: '/api/reflections/today-summary?date=2026/09/12' });
    expect(bad.statusCode).toBe(400);

    const ok = await app.inject({ method: 'GET', url: '/api/reflections/today-summary?date=2026-09-12' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().date).toBe('2026-09-12');
  });
});
