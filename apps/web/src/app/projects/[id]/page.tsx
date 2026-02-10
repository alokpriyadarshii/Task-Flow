'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

type ProjectDetail = {
  project: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    role: 'OWNER' | 'MEMBER';
  };
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusMeta: Record<
  TaskStatus,
  { label: string; badge: 'default' | 'info' | 'warning' | 'success' }
> = {
  TODO: { label: 'To do', badge: 'default' },
  IN_PROGRESS: { label: 'In progress', badge: 'warning' },
  DONE: { label: 'Done', badge: 'success' },
};

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth.accessToken) router.replace('/login');
  }, [auth.accessToken, router]);

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiFetch<ProjectDetail>(`/projects/${projectId}`),
    enabled: !!auth.accessToken,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => apiFetch<{ tasks: Task[] }>(`/projects/${projectId}/tasks`),
    enabled: !!auth.accessToken,
  });

  const [title, setTitle] = useState('');
  const trimmedTitle = title.trim();

  const createTask = useMutation({
    mutationFn: () =>
      apiFetch<{ task: Task }>(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title: trimmedTitle }),
      }),
    onSuccess: async () => {
      setTitle('');
      await qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiFetch<{ task: Task }>(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) =>
      apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const tasks = tasksQuery.data?.tasks ?? [];

  const columns = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) groups[t.status].push(t);
    return groups;
  }, [tasks]);

  const p = projectQuery.data?.project;

  const errCreate = createTask.error instanceof Error ? createTask.error.message : null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{p?.name ?? 'Project'}</h1>
            <Badge className="border-white/10 bg-white/5 text-zinc-200">
              {p?.role ?? 'MEMBER'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-300">{p?.description ?? 'Task board'}</p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 shadow-sm shadow-black/20 hover:bg-white/10"
          href="/dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="mt-8 grid gap-6">
        <Card>
          <CardHeader>
            <div className="font-medium">Create task</div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title…"
                className="flex-1"
              />
              <Button
                disabled={trimmedTitle.length < 2 || createTask.isPending}
                onClick={() => createTask.mutate()}
              >
                <Plus className="h-4 w-4" />
                {createTask.isPending ? 'Adding…' : 'Add task'}
              </Button>
            </div>
            {errCreate ? <p className="mt-2 text-sm text-red-300">{errCreate}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((status) => {
            const meta = statusMeta[status];
            return (
              <Card key={status}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                    </div>
                    <div className="text-sm text-zinc-400">{columns[status].length}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {columns[status].map((t) => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-black/20"
                      >
                        <div className="font-medium text-zinc-100">{t.title}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {status !== 'TODO' ? (
                            <Button
                              variant="secondary"
                              onClick={() => updateTask.mutate({ taskId: t.id, status: 'TODO' })}
                            >
                              To do
                            </Button>
                          ) : null}
                          {status !== 'IN_PROGRESS' ? (
                            <Button
                              variant="secondary"
                              onClick={() =>
                                updateTask.mutate({ taskId: t.id, status: 'IN_PROGRESS' })
                              }
                            >
                              In progress
                            </Button>
                          ) : null}
                          {status !== 'DONE' ? (
                            <Button
                              variant="secondary"
                              onClick={() => updateTask.mutate({ taskId: t.id, status: 'DONE' })}
                            >
                              Done
                            </Button>
                          ) : null}
                          <Button variant="ghost" onClick={() => deleteTask.mutate(t.id)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {tasksQuery.isLoading ? (
                      <p className="text-sm text-zinc-300">Loading…</p>
                    ) : null}
                    {!tasksQuery.isLoading && columns[status].length === 0 ? (
                      <p className="text-sm text-zinc-500">No tasks.</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
