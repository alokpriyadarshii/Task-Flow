import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const items = [
  { title: 'Auth', desc: 'JWT access + refresh sessions (httpOnly cookie)' },
  { title: 'Projects', desc: 'Membership-based access control' },
  { title: 'Tasks', desc: 'Kanban-ish workflow with CRUD & status' },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-14">
      <div className="flex items-center gap-2">
        <Badge variant="info" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Next.js + Fastify + PostgreSQL
        </Badge>
      </div>

      <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
        Ship tasks, not scaffolding
        <span className="block bg-gradient-to-r from-indigo-200 via-white to-cyan-200 bg-clip-text text-transparent">
          with TaskFlow
        </span>
      </h1>

      <p className="mt-4 max-w-2xl text-base text-zinc-300 md:text-lg">
        A clean, deployable full-stack starter with authentication, projects, and task boards. Built
        for speed, designed to look good by default.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login">
          <Button>
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary">Create account</Button>
        </Link>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <Card key={it.title} className="group">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-white/10 bg-white/5 p-2 shadow-sm shadow-black/20">
                  <CheckCircle2 className="h-4 w-4 text-indigo-200" />
                </div>
                <div>
                  <div className="font-medium text-zinc-100">{it.title}</div>
                  <div className="mt-1 text-sm text-zinc-300">{it.desc}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-sm text-zinc-400">
        Tip: login with <span className="text-zinc-200">admin@taskflow.local</span> /{' '}
        <span className="text-zinc-200">admin123</span>
      </div>
    </main>
  );
}
