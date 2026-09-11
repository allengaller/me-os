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
};
