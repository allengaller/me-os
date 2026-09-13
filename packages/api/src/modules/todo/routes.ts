import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

const statusEnum = z.enum(['inbox', 'todo', 'doing', 'done', 'cancelled']);
const priorityEnum = z.enum(['urgent', 'high', 'medium', 'low']);
const sourceEnum = z.enum(['manual', 'reflection', 'review']);
const energyEnum = z.enum(['high', 'medium', 'low']);

const listQuerySchema = z.object({
  status: z.string().optional(),
  priority: priorityEnum.optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  goalId: z.string().optional(),
  domainId: z.string().optional(),
});

const createTodoSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().optional(),
  goalId: z.string().optional(),
  domainId: z.string().optional(),
  source: sourceEnum.optional(),
  estimatedMinutes: z.number().optional(),
  energy: energyEnum.optional(),
  order: z.number().optional(),
});

const updateTodoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().nullable().optional(),
  goalId: z.string().nullable().optional(),
  domainId: z.string().nullable().optional(),
  source: sourceEnum.optional(),
  estimatedMinutes: z.number().nullable().optional(),
  energy: energyEnum.optional(),
  order: z.number().optional(),
});

export const todoRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const query = listQuerySchema.parse(request.query);

        const where: Prisma.TodoWhereInput = { userId };

        if (query.status) {
          const statuses = query.status.split(',');
          where.status = { in: statuses };
        }
        if (query.priority) where.priority = query.priority;
        const dueDateFilter: Prisma.DateTimeNullableFilter = {};
        if (query.dueBefore) dueDateFilter.lte = new Date(query.dueBefore);
        if (query.dueAfter) dueDateFilter.gte = new Date(query.dueAfter);
        if (Object.keys(dueDateFilter).length > 0) {
          where.dueDate = dueDateFilter;
        }
        if (query.goalId) where.goalId = query.goalId;
        if (query.domainId) where.domainId = query.domainId;

        const todos = await prisma.todo.findMany({
          where,
          orderBy: [{ order: 'asc' }, { dueDate: 'asc' }],
        });

        return { todos };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: '请求参数错误', details: error.errors });
        }
        throw error;
      }
    },
  });

  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const data = createTodoSchema.parse(request.body);

        const createData: Prisma.TodoUncheckedCreateInput = {
          userId,
          title: data.title,
          description: data.description,
          status: data.status ?? 'inbox',
          priority: data.priority ?? 'medium',
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          goalId: data.goalId ?? null,
          domainId: data.domainId ?? null,
          source: data.source ?? 'manual',
          estimatedMinutes: data.estimatedMinutes ?? null,
          energy: data.energy ?? null,
          order: data.order ?? 0,
        };

        if (data.status === 'done') {
          createData.completedAt = new Date();
        }

        const todo = await prisma.todo.create({ data: createData });

        return { todo };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: '请求参数错误', details: error.errors });
        }
        throw error;
      }
    },
  });

  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };

        const todo = await prisma.todo.findFirst({
          where: { id, userId },
        });

        if (!todo) {
          return reply.code(404).send({ error: 'Todo not found' });
        }

        return { todo };
      } catch (error) {
        throw error;
      }
    },
  });

  fastify.patch('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const data = updateTodoSchema.parse(request.body);

        const existing = await prisma.todo.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          return reply.code(404).send({ error: 'Todo not found' });
        }

        const updateData: Prisma.TodoUncheckedUpdateInput = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.source !== undefined) updateData.source = data.source;
        if (data.energy !== undefined) updateData.energy = data.energy;
        if (data.order !== undefined) updateData.order = data.order;
        if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        if (data.goalId !== undefined) updateData.goalId = data.goalId;
        if (data.domainId !== undefined) updateData.domainId = data.domainId;

        if (data.status !== undefined) {
          updateData.status = data.status;
          if (data.status === 'done') {
            updateData.completedAt = new Date();
          } else if (existing.status === 'done') {
            updateData.completedAt = null;
          }
        }

        const todo = await prisma.todo.update({
          where: { id },
          data: updateData,
        });

        return { todo };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: '请求参数错误', details: error.errors });
        }
        throw error;
      }
    },
  });

  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };

        const result = await prisma.todo.deleteMany({
          where: { id, userId },
        });

        if (result.count === 0) {
          return reply.code(404).send({ error: 'Todo not found' });
        }

        return { success: true };
      } catch (error) {
        throw error;
      }
    },
  });
};
