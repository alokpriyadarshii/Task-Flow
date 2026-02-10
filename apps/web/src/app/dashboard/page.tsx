'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, LogOut, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
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
      toast.success('Project created');
      await qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (e) => {
      const message = e instanceof Error ? e.message : 'Failed to create project';
      toast.error(message);
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
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-sm shadow-black/20">
            <Sparkles className="h-5 w-5 text-indigo-200" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-zinc-300">Projects you belong to.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-white/10 bg-white/5 text-zinc-200">{auth.user?.email}</Badge>
          <Button variant="secondary" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 font-medium">
              <Plus className="h-4 w-4 text-indigo-200" />
              Create project
            </div>
            <div className="text-sm text-zinc-300">Owners can edit/delete.</div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-300">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Redstone launch"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-300">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <Button
                disabled={trimmedName.length < 2 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 font-medium">
              <FolderKanban className="h-4 w-4 text-indigo-200" />
              Your projects
            </div>
            <div className="text-sm text-zinc-300">Open a project to manage tasks.</div>
          </CardHeader>
          <CardContent>
            {projectsQuery.isLoading ? (
              <p className="text-sm text-zinc-300">Loading…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-zinc-500">No projects yet.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="group block rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm shadow-black/20 transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-zinc-100">{p.name}</div>
                      <span className="text-sm text-zinc-400 transition group-hover:text-zinc-200">
                        Open →
                      </span>
                    </div>
                    {p.description ? (
                      <div className="mt-1 text-sm text-zinc-300">{p.description}</div>
                    ) : null}
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
