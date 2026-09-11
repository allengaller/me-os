import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const contentTypes = ['article', 'short-video', 'long-video', 'thread', 'podcast', 'other'] as const;
const contentStatuses = ['idea', 'drafting', 'ready', 'published', 'archived'] as const;
const priorities = ['low', 'medium', 'high'] as const;
const channelStatuses = ['active', 'paused', 'dormant'] as const;
const distributionStatuses = ['planned', 'published'] as const;
const workTypes = ['book', 'course', 'app', 'miniprogram', 'webapp', 'other'] as const;
const workStatuses = ['concept', 'in_progress', 'launched', 'maintained', 'archived'] as const;

const channelCreateSchema = z.object({
  platform: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  handle: z.string().max(200).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  positioning: z.string().max(2000).optional().nullable(),
  cadence: z.string().max(100).optional().nullable(),
  status: z.enum(channelStatuses).optional(),
  order: z.number().int().optional(),
});

const channelUpdateSchema = channelCreateSchema.partial();

const snapshotCreateSchema = z.object({
  channelId: z.string().min(1),
  followers: z.number().int().min(0),
  views: z.number().int().min(0).optional().nullable(),
  likes: z.number().int().min(0).optional().nullable(),
  comments: z.number().int().min(0).optional().nullable(),
  shares: z.number().int().min(0).optional().nullable(),
  revenue: z.number().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

const listSnapshotsSchema = z.object({
  channelId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const profileSchema = z.object({
  mission: z.string().max(5000).optional().nullable(),
  positioning: z.string().max(500).optional().nullable(),
  slogan: z.string().max(200).optional().nullable(),
  personaTags: z.string().max(500).optional().nullable(),
  toneOfVoice: z.string().max(2000).optional().nullable(),
  targetAudience: z.string().max(2000).optional().nullable(),
  visualNotes: z.string().max(2000).optional().nullable(),
});

const pillarCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional().nullable(),
  order: z.number().int().optional(),
});

const pillarUpdateSchema = pillarCreateSchema.partial();

const contentCreateSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(contentTypes).optional(),
  status: z.enum(contentStatuses).optional(),
  coreMessage: z.string().max(2000).optional().nullable(),
  outline: z.string().max(50000).optional().nullable(),
  priority: z.enum(priorities).optional(),
  publishDue: z.coerce.date().optional().nullable(),
  pillarId: z.string().optional().nullable(),
  topicId: z.string().optional().nullable(),
  tags: z.string().max(500).optional().nullable(),
  reviewNote: z.string().max(10000).optional().nullable(),
  order: z.number().int().optional(),
});

const contentUpdateSchema = contentCreateSchema.partial();

const listContentsSchema = z.object({
  status: z.enum(contentStatuses).optional(),
  type: z.enum(contentTypes).optional(),
  pillarId: z.string().optional(),
  topicId: z.string().optional(),
  q: z.string().optional(),
});

const distributionCreateSchema = z.object({
  channelId: z.string().min(1),
  adaptedTitle: z.string().max(300).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

const distributionUpdateSchema = z.object({
  status: z.enum(distributionStatuses).optional(),
  adaptedTitle: z.string().max(300).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  views: z.number().int().min(0).optional().nullable(),
  likes: z.number().int().min(0).optional().nullable(),
  comments: z.number().int().min(0).optional().nullable(),
  shares: z.number().int().min(0).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

const workCreateSchema = z.object({
  name: z.string().min(1).max(300),
  type: z.enum(workTypes).optional(),
  status: z.enum(workStatuses).optional(),
  description: z.string().max(5000).optional().nullable(),
  progress: z.string().max(2000).optional().nullable(),
  url: z.string().max(500).optional().nullable(),
  launchedAt: z.coerce.date().optional().nullable(),
  order: z.number().int().optional(),
});

const workUpdateSchema = workCreateSchema.partial();

async function handleError(fastify: FastifyInstance, error: unknown, reply: FastifyReply) {
  if (error instanceof z.ZodError) {
    return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return reply.code(400).send({ error: '记录已存在' });
  }
  fastify.log.error(error);
  return reply.code(500).send({ error: 'Server error' });
}

async function ensureProfile(userId: string) {
  const existing = await prisma.brandProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.brandProfile.create({ data: { userId } });
}

async function assertRefOwned(
  model: 'brandPillar' | 'topic',
  id: string,
  userId: string,
): Promise<boolean> {
  if (model === 'brandPillar') {
    const found = await prisma.brandPillar.findFirst({ where: { id, userId }, select: { id: true } });
    return Boolean(found);
  }
  const found = await prisma.topic.findFirst({ where: { id, userId }, select: { id: true } });
  return Boolean(found);
}

export const brandRoutes: FastifyPluginAsync = async (fastify) => {
  // ---------- 品牌档案 ----------
  fastify.get('/profile', { onRequest: [fastify.authenticate] }, async (request) => {
    const profile = await prisma.brandProfile.findUnique({ where: { userId: request.user.userId } });
    if (profile) return { profile };
    return {
      profile: {
        userId: request.user.userId,
        mission: null,
        positioning: null,
        slogan: null,
        personaTags: null,
        toneOfVoice: null,
        targetAudience: null,
        visualNotes: null,
      },
    };
  });

  fastify.put('/profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = profileSchema.parse(request.body);
      const profile = await prisma.brandProfile.upsert({
        where: { userId: request.user.userId },
        update: data,
        create: { ...data, userId: request.user.userId },
      });
      return { profile };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 内容支柱 ----------
  fastify.get('/pillars', { onRequest: [fastify.authenticate] }, async (request) => {
    const pillars = await prisma.brandPillar.findMany({
      where: { userId: request.user.userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return { pillars };
  });

  fastify.post('/pillars', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = pillarCreateSchema.parse(request.body);
      const profile = await ensureProfile(request.user.userId);
      const pillar = await prisma.brandPillar.create({
        data: { ...data, userId: request.user.userId, profileId: profile.id },
      });
      return reply.code(201).send({ pillar });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/pillars/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = pillarUpdateSchema.parse(request.body);
      const result = await prisma.brandPillar.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Pillar not found' });
      const pillar = await prisma.brandPillar.findUnique({ where: { id } });
      return { pillar };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/pillars/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.brandPillar.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Pillar not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 平台渠道 ----------
  fastify.get('/channels', { onRequest: [fastify.authenticate] }, async (request) => {
    const channels = await prisma.platformChannel.findMany({
      where: { userId: request.user.userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return { channels };
  });

  fastify.post('/channels', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = channelCreateSchema.parse(request.body);
      const channel = await prisma.platformChannel.create({
        data: { ...data, userId: request.user.userId },
      });
      return reply.code(201).send({ channel });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/channels/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = channelUpdateSchema.parse(request.body);
      const result = await prisma.platformChannel.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Channel not found' });
      const channel = await prisma.platformChannel.findUnique({ where: { id } });
      return { channel };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/channels/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.platformChannel.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Channel not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 指标快照 ----------
  fastify.post('/snapshots', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = snapshotCreateSchema.parse(request.body);
      const channel = await prisma.platformChannel.findFirst({
        where: { id: data.channelId, userId: request.user.userId },
        select: { id: true },
      });
      if (!channel) return reply.code(400).send({ error: '渠道不存在' });
      const snapshot = await prisma.metricSnapshot.create({
        data: {
          userId: request.user.userId,
          channelId: data.channelId,
          followers: data.followers,
          views: data.views,
          likes: data.likes,
          comments: data.comments,
          shares: data.shares,
          revenue: data.revenue,
          note: data.note,
        },
      });
      return reply.code(201).send({ snapshot });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.get('/snapshots', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const query = listSnapshotsSchema.parse(request.query);
      const snapshots = await prisma.metricSnapshot.findMany({
        where: {
          userId: request.user.userId,
          ...(query.channelId ? { channelId: query.channelId } : {}),
        },
        orderBy: { recordedAt: 'desc' },
        take: query.limit ?? 30,
      });
      return { snapshots };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 内容流水线 ----------
  fastify.get('/contents', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const query = listContentsSchema.parse(request.query);
      const where: Prisma.ContentItemWhereInput = { userId: request.user.userId };
      if (query.status) where.status = query.status;
      if (query.type) where.type = query.type;
      if (query.pillarId) where.pillarId = query.pillarId;
      if (query.topicId) where.topicId = query.topicId;
      if (query.q) where.title = { contains: query.q };

      const contents = await prisma.contentItem.findMany({
        where,
        orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
        include: {
          pillar: true,
          topic: { select: { id: true, title: true } },
          _count: { select: { distributions: true } },
        },
      });
      return { contents };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.post('/contents', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = contentCreateSchema.parse(request.body);
      if (data.pillarId && !(await assertRefOwned('brandPillar', data.pillarId, request.user.userId))) {
        return reply.code(400).send({ error: '内容支柱不存在' });
      }
      if (data.topicId && !(await assertRefOwned('topic', data.topicId, request.user.userId))) {
        return reply.code(400).send({ error: '课题不存在' });
      }
      const content = await prisma.contentItem.create({
        data: { ...data, userId: request.user.userId },
      });
      return reply.code(201).send({ content });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.get('/contents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const content = await prisma.contentItem.findFirst({
        where: { id, userId: request.user.userId },
        include: {
          distributions: { include: { channel: true }, orderBy: { createdAt: 'asc' } },
          pillar: true,
          topic: { select: { id: true, title: true } },
        },
      });
      if (!content) return reply.code(404).send({ error: 'Content not found' });
      return { content };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/contents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = contentUpdateSchema.parse(request.body);
      if (data.pillarId && !(await assertRefOwned('brandPillar', data.pillarId, request.user.userId))) {
        return reply.code(400).send({ error: '内容支柱不存在' });
      }
      if (data.topicId && !(await assertRefOwned('topic', data.topicId, request.user.userId))) {
        return reply.code(400).send({ error: '课题不存在' });
      }
      const result = await prisma.contentItem.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Content not found' });
      const content = await prisma.contentItem.findUnique({ where: { id } });
      return { content };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/contents/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.contentItem.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Content not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 分发记录（一鱼多吃） ----------
  fastify.post('/contents/:id/distributions', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = distributionCreateSchema.parse(request.body);
      const content = await prisma.contentItem.findFirst({
        where: { id, userId: request.user.userId },
        select: { id: true },
      });
      if (!content) return reply.code(404).send({ error: 'Content not found' });
      const channel = await prisma.platformChannel.findFirst({
        where: { id: data.channelId, userId: request.user.userId },
        select: { id: true },
      });
      if (!channel) return reply.code(400).send({ error: '渠道不存在' });
      const dup = await prisma.contentDistribution.findUnique({
        where: { contentId_channelId: { contentId: id, channelId: data.channelId } },
      });
      if (dup) return reply.code(400).send({ error: '该渠道已有分发记录' });
      const distribution = await prisma.contentDistribution.create({
        data: {
          userId: request.user.userId,
          contentId: id,
          channelId: data.channelId,
          adaptedTitle: data.adaptedTitle,
          note: data.note,
        },
        include: { channel: true },
      });
      return reply.code(201).send({ distribution });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/distributions/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = distributionUpdateSchema.parse(request.body);
      const existing = await prisma.contentDistribution.findFirst({
        where: { id, userId: request.user.userId },
        include: { content: true },
      });
      if (!existing) return reply.code(404).send({ error: 'Distribution not found' });

      const updateData: Prisma.ContentDistributionUpdateInput = { ...data };
      if (data.status === 'published') {
        const publishedAt = data.publishedAt ?? existing.publishedAt ?? new Date();
        updateData.publishedAt = publishedAt;
        // 发布自动化：归档内容除外，首个渠道发布即完成内容
        if (existing.content.status !== 'archived') {
          await prisma.contentItem.update({
            where: { id: existing.contentId },
            data: {
              status: 'published',
              ...(existing.content.publishedAt ? {} : { publishedAt }),
            },
          });
        }
      }
      const distribution = await prisma.contentDistribution.update({
        where: { id },
        data: updateData,
        include: { channel: true },
      });
      return { distribution };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/distributions/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.contentDistribution.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Distribution not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  // ---------- 作品库 ----------
  fastify.get('/works', { onRequest: [fastify.authenticate] }, async (request) => {
    const works = await prisma.work.findMany({
      where: { userId: request.user.userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return { works };
  });

  fastify.post('/works', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = workCreateSchema.parse(request.body);
      const work = await prisma.work.create({
        data: { ...data, userId: request.user.userId },
      });
      return reply.code(201).send({ work });
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.patch('/works/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = workUpdateSchema.parse(request.body);
      const result = await prisma.work.updateMany({
        where: { id, userId: request.user.userId },
        data,
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Work not found' });
      const work = await prisma.work.findUnique({ where: { id } });
      return { work };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });

  fastify.delete('/works/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await prisma.work.deleteMany({
        where: { id, userId: request.user.userId },
      });
      if (result.count === 0) return reply.code(404).send({ error: 'Work not found' });
      return { success: true };
    } catch (error) {
      return handleError(fastify, error, reply);
    }
  });
};
