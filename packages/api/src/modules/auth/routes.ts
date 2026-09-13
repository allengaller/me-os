import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authService } from '../../services/auth.service.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (request, reply) => {
    try {
      const input = registerSchema.parse(request.body);
      const result = await authService.register(input);
      const token = fastify.jwt.sign({ userId: result.user.id });
      return { user: result.user, token };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: '请求参数错误', details: error.errors });
      }
      if (error instanceof Error && error.message === '邮箱已被注册') {
        return reply.code(400).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.post('/login', async (request, reply) => {
    try {
      const input = loginSchema.parse(request.body);
      const result = await authService.login(input, (payload) =>
        fastify.jwt.sign(payload)
      );
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: '请求参数错误', details: error.errors });
      }
      if (error instanceof Error && error.message === '邮箱或密码错误') {
        return reply.code(401).send({ error: error.message });
      }
      throw error;
    }
  });

  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const user = await authService.getUserById(request.user.userId);
      if (!user) {
        return reply.code(404).send({ error: '用户不存在' });
      }
      return { user };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: '服务器错误' });
    }
  });
};