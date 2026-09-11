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
};
