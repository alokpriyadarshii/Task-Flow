'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth.accessToken) router.replace('/login');
  }, [auth.accessToken, router]);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<{ projects: Project[] }>('/projects'),
    enabled: !!auth.accessToken,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription.length > 0 ? trimmedDescription : null,
        }),
      }),
    onSuccess: async () => {
      setName('');
      setDescription('');
      await qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      auth.clear();
      router.replace('/');
    }
  };

  const projects = projectsQuery.data?.projects ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-zinc-300">Projects you belong to.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-300">{auth.user?.email}</div>
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="font-medium">Create project</div>
            <div className="text-sm text-zinc-300">Owners can edit/delete.</div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-300">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Redstone launch" />
              </div>
              <div>
                <label className="text-sm text-zinc-300">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
              </div>
              <Button disabled={trimmedName.length < 2 || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
              {createMutation.error && (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
                <p className="text-sm text-red-300">{(createMutation.error as any).message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-medium">Your projects</div>
            <div className="text-sm text-zinc-300">Open a project to manage tasks.</div>
          </CardHeader>
          <CardContent>
            {projectsQuery.isLoading ? (
              <p className="text-sm text-zinc-300">Loading…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-zinc-300">No projects yet.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block rounded-2xl border border-zinc-800 p-4 hover:bg-zinc-900"
                  >
                    <div className="font-medium">{p.name}</div>
                    {p.description ? <div className="mt-1 text-sm text-zinc-300">{p.description}</div> : null}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
