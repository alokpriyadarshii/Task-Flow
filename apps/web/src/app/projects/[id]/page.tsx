'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

  const createTask = useMutation({
    mutationFn: () =>
      apiFetch<{ task: Task }>(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title }),
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

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{p?.name ?? 'Project'}</h1>
          <p className="text-sm text-zinc-300">{p?.description ?? 'Task board'}</p>
        </div>
        <Link className="text-sm text-zinc-100 underline" href="/dashboard">
          ← Back to dashboard
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="font-medium">Create task</div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…" className="flex-1" />
              <Button disabled={!title.trim() || createTask.isPending} onClick={() => createTask.mutate()}>
                {createTask.isPending ? 'Adding…' : 'Add task'}
              </Button>
            </div>
            {createTask.error && <p className="mt-2 text-sm text-red-300">{(createTask.error as any).message}</p>}
          </CardContent>
        </Card>

        {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((status) => (
          <Card key={status}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-medium">{status.replace('_', ' ')}</div>
                <div className="text-sm text-zinc-400">{columns[status].length}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {columns[status].map((t) => (
                  <div key={t.id} className="rounded-2xl border border-zinc-800 p-4">
                    <div className="font-medium">{t.title}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {status !== 'TODO' && (
                        <Button variant="secondary" onClick={() => updateTask.mutate({ taskId: t.id, status: 'TODO' })}>
                          To do
                        </Button>
                      )}
                      {status !== 'IN_PROGRESS' && (
                        <Button
                          variant="secondary"
                          onClick={() => updateTask.mutate({ taskId: t.id, status: 'IN_PROGRESS' })}
                        >
                          In progress
                        </Button>
                      )}
                      {status !== 'DONE' && (
                        <Button variant="secondary" onClick={() => updateTask.mutate({ taskId: t.id, status: 'DONE' })}>
                          Done
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => deleteTask.mutate(t.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {tasksQuery.isLoading ? <p className="text-sm text-zinc-300">Loading…</p> : null}
                {!tasksQuery.isLoading && columns[status].length === 0 ? (
                  <p className="text-sm text-zinc-500">No tasks.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
