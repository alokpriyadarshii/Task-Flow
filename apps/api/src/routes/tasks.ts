import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../utils/auth.js';
import { AppError } from '../utils/errors.js';

const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: taskStatusSchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: taskStatusSchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

async function assertProjectMember(app: any, projectId: string, userId: string) {
  const membership = await app.prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new AppError('FORBIDDEN', 'Not a member of this project', 403);
  return membership;
}

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/projects/:projectId/tasks',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              tasks: z.array(
                z.object({
                  id: z.string(),
                  projectId: z.string(),
                  title: z.string(),
                  description: z.string().nullable().optional(),
                  status: taskStatusSchema,
                  dueDate: z.string().nullable().optional(),
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
      const { projectId } = req.params as { projectId: string };
      const userId = req.user!.id;

      await assertProjectMember(app, projectId, userId);

      const tasks = await app.prisma.task.findMany({
        where: { projectId },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      });

      return {
        ok: true,
        data: {
          tasks: tasks.map((t: any) => ({
            id: t.id,
            projectId: t.projectId,
            title: t.title,
            description: t.description,
            status: t.status,
            dueDate: t.dueDate ? t.dueDate.toISOString() : null,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
          })),
        },
      };
    },
  );

  app.post(
    '/projects/:projectId/tasks',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ projectId: z.string().uuid() }),
        body: createTaskSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              task: z.object({
                id: z.string(),
                projectId: z.string(),
                title: z.string(),
                description: z.string().nullable().optional(),
                status: taskStatusSchema,
                dueDate: z.string().nullable().optional(),
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
      const body = req.body as any;

      await assertProjectMember(app, projectId, userId);

      const task = await app.prisma.task.create({
        data: {
          projectId,
          title: body.title,
          description: body.description ?? null,
          status: body.status ?? 'TODO',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
      });

      return {
        ok: true,
        data: {
          task: {
            id: task.id,
            projectId: task.projectId,
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
          },
        },
      };
    },
  );

  app.patch(
    '/tasks/:taskId',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ taskId: z.string().uuid() }),
        body: updateTaskSchema,
        response: {
          200: z.object({
            ok: z.literal(true),
            data: z.object({
              task: z.object({
                id: z.string(),
                projectId: z.string(),
                title: z.string(),
                description: z.string().nullable().optional(),
                status: taskStatusSchema,
                dueDate: z.string().nullable().optional(),
                createdAt: z.string(),
                updatedAt: z.string(),
              }),
            }),
          }),
        },
      },
    },
    async (req) => {
      const { taskId } = req.params as { taskId: string };
      const userId = req.user!.id;
      const body = req.body as any;

      const existing = await app.prisma.task.findUnique({ where: { id: taskId } });
      if (!existing) throw new AppError('NOT_FOUND', 'Task not found', 404);

      await assertProjectMember(app, existing.projectId, userId);

      const task = await app.prisma.task.update({
        where: { id: taskId },
        data: {
          title: body.title ?? undefined,
          description: body.description === undefined ? undefined : body.description,
          status: body.status ?? undefined,
          dueDate:
            body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
        },
      });

      return {
        ok: true,
        data: {
          task: {
            id: task.id,
            projectId: task.projectId,
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
          },
        },
      };
    },
  );

  app.delete(
    '/tasks/:taskId',
    {
      preHandler: requireAuth(app),
      schema: {
        params: z.object({ taskId: z.string().uuid() }),
        response: {
          200: z.object({ ok: z.literal(true), data: z.object({ message: z.string() }) }),
        },
      },
    },
    async (req) => {
      const { taskId } = req.params as { taskId: string };
      const userId = req.user!.id;

      const existing = await app.prisma.task.findUnique({ where: { id: taskId } });
      if (!existing) throw new AppError('NOT_FOUND', 'Task not found', 404);

      await assertProjectMember(app, existing.projectId, userId);
      await app.prisma.task.delete({ where: { id: taskId } });

      return { ok: true, data: { message: 'Deleted' } };
    },
  );
};
