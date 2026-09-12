import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const healthTypes = ['sleep', 'exercise', 'weight', 'mood', 'energy', 'water', 'custom'] as const;

const listHealthSchema = z.object({
  type: z.enum(healthTypes).optional(),
  from: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  to: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

const createHealthSchema = z.object({
  type: z.enum(healthTypes),
  value: z.number(),
  unit: z.string(),
  note: z.string().optional(),
  recordedAt: z.date().optional(),
});

const summarySchema = z.object({
  days: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v ? Number(v) : 7)),
});

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/summary', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { days } = summarySchema.parse(request.query);
      const from = new Date();
      from.setDate(from.getDate() - days);

      const records = await prisma.healthRecord.findMany({
        where: { userId, recordedAt: { gte: from } },
        orderBy: { recordedAt: 'desc' },
      });

      const summary: Record<string, { avg: number; count: number; latest: number | null }> = {};
      const grouped: Record<string, number[]> = {};

      for (const record of records) {
        if (!grouped[record.type]) grouped[record.type] = [];
        grouped[record.type].push(record.value);
      }

      for (const [type, values] of Object.entries(grouped)) {
        const sum = values.reduce((a, b) => a + b, 0);
        const latestRecord = records.find((r) => r.type === type);
        summary[type] = {
          avg: Number((sum / values.length).toFixed(2)),
          count: values.length,
          latest: latestRecord ? latestRecord.value : null,
        };
      }

      return { summary };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const query = listHealthSchema.parse(request.query);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const where: Prisma.HealthRecordWhereInput = { userId };
      if (query.type) where.type = query.type;
      where.recordedAt = { gte: query.from || sevenDaysAgo };
      if (query.to) {
        const endOfDay = new Date(query.to);
        endOfDay.setHours(23, 59, 59, 999);
        where.recordedAt.lte = endOfDay;
      }

      const records = await prisma.healthRecord.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
      });
      return { records };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const data = createHealthSchema.parse(request.body);
      const record = await prisma.healthRecord.create({
        data: { ...data, userId },
      });
      return { record };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };
      const result = await prisma.healthRecord.deleteMany({
        where: { id, userId },
      });
      if (result.count === 0) {
        return reply.code(404).send({ error: 'Record not found' });
      }
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  // 获取单条健康记录
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };

      const record = await prisma.healthRecord.findFirst({
        where: { id, userId },
      });

      if (!record) {
        return reply.code(404).send({ error: 'Record not found' });
      }

      return { record };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  // 更新健康记录
  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };
      const data = createHealthSchema.partial().parse(request.body);

      const existing = await prisma.healthRecord.findFirst({ where: { id, userId } });
      if (!existing) {
        return reply.code(404).send({ error: 'Record not found' });
      }

      const record = await prisma.healthRecord.update({
        where: { id },
        data,
      });

      return { record };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Server error' });
    }
  });
};
