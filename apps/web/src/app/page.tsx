import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6">
      <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">TaskFlow</h1>
        <p className="mt-2 max-w-2xl text-zinc-300">
          A deployable full-stack starter: Next.js + Fastify + PostgreSQL + Prisma.
        </p>

        <div className="mt-6 flex gap-3">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-3 text-sm text-zinc-300 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 p-4">
            <div className="font-medium text-zinc-100">Auth</div>
            <div className="mt-1">JWT access + refresh sessions (httpOnly cookie)</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 p-4">
            <div className="font-medium text-zinc-100">Projects</div>
            <div className="mt-1">Membership-based access control</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 p-4">
            <div className="font-medium text-zinc-100">Tasks</div>
            <div className="mt-1">CRUD tasks with status & due dates</div>
          </div>
        </div>
      </div>
    </main>
  );
}
