import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomToken, sha256 } from '../utils/crypto.js';
import { AppError } from '../utils/errors.js';
import type { Env } from '../config.js';

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function cookieOptions(env: Env) {
  const secure = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
  } as const;
}

export const authRoutes: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const { env } = opts;

  app.post(
    '/register',
    {
      schema: {
        body: registerSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              user: z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
                role: z.enum(['ADMIN', 'USER']),
              }),
              accessToken: z.string(),
            }),
          }),
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
      if (existing) throw new AppError('EMAIL_TAKEN', 'Email is already registered', 409);

      const passwordHash = await bcrypt.hash(body.password, 12);

      const user = await app.prisma.user.create({
        data: { name: body.name, email: body.email, passwordHash, role: 'USER' },
        select: { id: true, name: true, email: true, role: true },
      });

      const accessToken = app.jwt.sign(
        { sub: user.id, email: user.email, name: user.name, role: user.role },
        { expiresIn: '15m' },
      );

      const refreshToken = randomToken();
      const refreshTokenHash = sha256(refreshToken);
      const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

      await app.prisma.session.create({
        data: { userId: user.id, refreshTokenHash, expiresAt },
      });

      reply.setCookie('refresh_token', refreshToken, cookieOptions(env));

      return reply.send({ ok: true, data: { user, accessToken } });
    },
  );

  app.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              user: z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
                role: z.enum(['ADMIN', 'USER']),
              }),
              accessToken: z.string(),
            }),
          }),
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const user = await app.prisma.user.findUnique({ where: { email: body.email } });
      if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);

      const ok = await bcrypt.compare(body.password, user.passwordHash);
      if (!ok) throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);

      const accessToken = app.jwt.sign(
        { sub: user.id, email: user.email, name: user.name, role: user.role },
        { expiresIn: '15m' },
      );

      const refreshToken = randomToken();
      const refreshTokenHash = sha256(refreshToken);
      const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

      await app.prisma.session.create({
        data: { userId: user.id, refreshTokenHash, expiresAt },
      });

      reply.setCookie('refresh_token', refreshToken, cookieOptions(env));

      return reply.send({
        ok: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          accessToken,
        },
      });
    },
  );

  app.post(
    '/refresh',
    {
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({ accessToken: z.string() }),
          }),
        },
      },
    },
    async (req, reply) => {
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) throw new AppError('UNAUTHORIZED', 'Unauthorized', 401);

      const refreshTokenHash = sha256(refreshToken);

      const session = await app.prisma.session.findFirst({
        where: { refreshTokenHash, expiresAt: { gt: new Date() } },
        include: { user: true },
      });

      if (!session) throw new AppError('UNAUTHORIZED', 'Unauthorized', 401);

      await app.prisma.session.delete({ where: { id: session.id } });

      const nextRefreshToken = randomToken();
      const nextRefreshTokenHash = sha256(nextRefreshToken);
      const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

      await app.prisma.session.create({
        data: { userId: session.userId, refreshTokenHash: nextRefreshTokenHash, expiresAt },
      });

      reply.setCookie('refresh_token', nextRefreshToken, cookieOptions(env));

      const accessToken = app.jwt.sign(
        {
          sub: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
        { expiresIn: '15m' },
      );

      return reply.send({ ok: true, data: { accessToken } });
    },
  );

  app.post('/logout', async (_req, reply) => {
    reply.clearCookie('refresh_token', { path: '/' });
    return reply.send({ ok: true, data: { message: 'Logged out' } });
  });
};
