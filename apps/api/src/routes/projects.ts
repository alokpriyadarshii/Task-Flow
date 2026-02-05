import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../utils/auth.js';
import { AppError } from '../utils/errors.js';

const createProjectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      preHandler: requireAuth(app),
      schema: {
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              projects: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  description: z.string().nullable().optional(),
                  createdAt: z.string(),
                  updatedAt: z.string(),
                }),
              ),
            }),
          }),
        },
      },
    },
    async (req) => {
      const userId = req.user!.id;

      const memberships = await app.prisma.projectMember.findMany({
        where: { userId },
        include: { project: true },
        orderBy: { project: { updatedAt: 'desc' } },
      });

      const projects = memberships.map((m) => ({
        id: m.project.id,
        name: m.project.name,
        description: m.project.description,
        createdAt: m.project.createdAt.toISOString(),
        updatedAt: m.project.updatedAt.toISOString(),
      }));

      return { ok: true, data: { projects } };
    },
  );

  app.post(
    '/',
    {
      preHandler: requireAuth(app),
      schema: {
        body: createProjectSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              project: z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().nullable().optional(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            }),
          }),
        },
      },
    },
    async (req) => {
      const userId = req.user!.id;
      const body = req.body as any;

      const project = await app.prisma.project.create({
        data: {
          ownerId: userId,
          name: body.name,
          description: body.description ?? null,
          members: { create: [{ userId, role: 'OWNER' }] },
        },
      });

      return {
        ok: true,
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          },
        },
      };
    },
  );

  app.get(
    '/:projectId',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              project: z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().nullable().optional(),
                createdAt: z.string(),
                updatedAt: z.string(),
                role: z.enum(['OWNER', 'MEMBER']),
              }),
            }),
          }),
        },
      },
    },
    async (req) => {
      const { projectId } = req.params as { projectId: string };
      const userId = req.user!.id;

      const membership = await app.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
        include: { project: true },
      });

      if (!membership) throw new AppError('FORBIDDEN', 'Not a member of this project', 403);

      const p = membership.project;

      return {
        ok: true,
        data: {
          project: {
            id: p.id,
            name: p.name,
            description: p.description,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            role: membership.role,
          },
        },
      };
    },
  );

  app.patch(
    '/:projectId',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
        body: updateProjectSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              project: z.object({
                id: z.string(),
                name: z.string(),
                description: z.string().nullable().optional(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            }),
          }),
        },
      },
    },
    async (req) => {
      const { projectId } = req.params as { projectId: string };
      const userId = req.user!.id;

      const membership = await app.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      if (!membership) throw new AppError('FORBIDDEN', 'Not a member of this project', 403);
      if (membership.role !== 'OWNER') throw new AppError('FORBIDDEN', 'Only owners can edit project', 403);

      const body = req.body as any;

      const project = await app.prisma.project.update({
        where: { id: projectId },
        data: {
          name: body.name ?? undefined,
          description: body.description === undefined ? undefined : body.description,
        },
      });

      return {
        ok: true,
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
          },
        },
      };
    },
  );

  app.delete(
    '/:projectId',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
        response: { 200: z.object({ ok: z.literal(true), data: z.object({ message: z.string() }) }) },
      },
    },
    async (req) => {
      const { projectId } = req.params as { projectId: string };
      const userId = req.user!.id;

      const membership = await app.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });

      if (!membership) throw new AppError('FORBIDDEN', 'Not a member of this project', 403);
      if (membership.role !== 'OWNER') throw new AppError('FORBIDDEN', 'Only owners can delete project', 403);

      await app.prisma.project.delete({ where: { id: projectId } });

      return { ok: true, data: { message: 'Deleted' } };
    },
  );
};
