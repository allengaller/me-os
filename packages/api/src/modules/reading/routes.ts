import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const readingTypes = ['book', 'article', 'video', 'podcast', 'course'] as const;
const readingStatuses = ['want', 'reading', 'done', 'abandoned'] as const;

const listReadingSchema = z.object({
  status: z.enum(readingStatuses).optional(),
  topicId: z.string().optional(),
});

const createReadingSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  type: z.enum(readingTypes).optional(),
  url: z.string().optional(),
  note: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  topicId: z.string().optional(),
});

const updateReadingSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional().nullable(),
  type: z.enum(readingTypes).optional(),
  status: z.enum(readingStatuses).optional(),
  url: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  topicId: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

export const readingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const query = listReadingSchema.parse(request.query);
      const where: Prisma.ReadingItemWhereInput = { userId };
      if (query.status) where.status = query.status;
      if (query.topicId) where.topicId = query.topicId;

      const items = await prisma.readingItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });
      return { items };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      throw error;
    }
  });

  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const data = createReadingSchema.parse(request.body);
      const item = await prisma.readingItem.create({
        data: { ...data, userId },
      });
      return { item };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      throw error;
    }
  });

  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };
      const item = await prisma.readingItem.findFirst({
        where: { id, userId },
      });
      if (!item) {
        return reply.code(404).send({ error: 'Item not found' });
      }
      return { item };
    } catch (error) {
      throw error;
    }
  });

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };
      const data = updateReadingSchema.parse(request.body);

      const updateData: Prisma.ReadingItemUpdateInput = { ...data };

      if (data.status === 'reading') {
        const existing = await prisma.readingItem.findFirst({ where: { id, userId } });
        if (existing && !existing.startDate) {
          updateData.startDate = new Date();
        }
      }

      if (data.status === 'done') {
        const existing = await prisma.readingItem.findFirst({ where: { id, userId } });
        if (existing && !existing.endDate) {
          updateData.endDate = new Date();
        }
      }

      const result = await prisma.readingItem.updateMany({
        where: { id, userId },
        data: updateData,
      });

      if (result.count === 0) {
        return reply.code(404).send({ error: 'Item not found' });
      }

      const item = await prisma.readingItem.findUnique({ where: { id } });
      return { item };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      throw error;
    }
  });

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };
      const result = await prisma.readingItem.deleteMany({
        where: { id, userId },
      });
      if (result.count === 0) {
        return reply.code(404).send({ error: 'Item not found' });
      }
      return { success: true };
    } catch (error) {
      throw error;
    }
  });
};
