import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const relations = ['friend', 'colleague', 'mentor', 'family', 'other'] as const;
const contactFreqs = ['weekly', 'monthly', 'quarterly'] as const;

const listContactSchema = z.object({
  relation: z.enum(relations).optional(),
  needsContact: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

const createContactSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  company: z.string().optional(),
  relation: z.enum(relations).optional(),
  tags: z.any().optional(),
  notes: z.string().optional(),
  contactFreq: z.enum(contactFreqs).optional(),
  lastContact: z.date().optional(),
  domainId: z.string().optional(),
});

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  relation: z.enum(relations).optional(),
  tags: z.any().optional().nullable(),
  notes: z.string().optional().nullable(),
  contactFreq: z.enum(contactFreqs).optional().nullable(),
  lastContact: z.date().optional().nullable(),
  domainId: z.string().optional().nullable(),
});

const touchSchema = z.object({
  note: z.string().optional(),
});

export const contactRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const query = listContactSchema.parse(request.query);
      const where: Prisma.ContactWhereInput = { userId };
      if (query.relation) where.relation = query.relation;

      if (query.needsContact) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        where.OR = [
          { lastContact: null },
          { contactFreq: 'weekly', lastContact: { lte: weekAgo } },
          { contactFreq: 'monthly', lastContact: { lte: monthAgo } },
          { contactFreq: 'quarterly', lastContact: { lte: quarterAgo } },
          { contactFreq: null, lastContact: { lte: monthAgo } },
        ];
      }

      const contacts = await prisma.contact.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      return { contacts };
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
      const data = createContactSchema.parse(request.body);
      const contact = await prisma.contact.create({
        data: { ...data, userId },
      });
      return { contact };
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
      const contact = await prisma.contact.findFirst({
        where: { id, userId },
      });
      if (!contact) {
        return reply.code(404).send({ error: 'Contact not found' });
      }
      return { contact };
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
      const data = updateContactSchema.parse(request.body);
      const result = await prisma.contact.updateMany({
        where: { id, userId },
        data,
      });
      if (result.count === 0) {
        return reply.code(404).send({ error: 'Contact not found' });
      }
      const contact = await prisma.contact.findUnique({ where: { id } });
      return { contact };
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
      const result = await prisma.contact.deleteMany({
        where: { id, userId },
      });
      if (result.count === 0) {
        return reply.code(404).send({ error: 'Contact not found' });
      }
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  fastify.post('/:id/touch', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { id } = request.params as { id: string };
      touchSchema.parse(request.body);

      const result = await prisma.contact.updateMany({
        where: { id, userId },
        data: { lastContact: new Date() },
      });
      if (result.count === 0) {
        return reply.code(404).send({ error: 'Contact not found' });
      }
      const contact = await prisma.contact.findUnique({ where: { id } });
      return { contact };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid parameters', details: error.errors });
      }
      throw error;
    }
  });
};
