'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;
type User = { id: string; email: string; name: string; role: 'ADMIN' | 'USER' };

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await apiFetch<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setAuth({ user: data.user, accessToken: data.accessToken });
      toast.success('Signed in');
      router.push('/dashboard');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed';
      toast.error(message);
      setError('email', { message });
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
      <div className="space-y-5">
        <Badge variant="info" className="gap-1">
          <LockKeyhole className="h-3.5 w-3.5" />
          Secure sign-in
        </Badge>
        <h1 className="text-4xl font-semibold leading-tight">
          Welcome back to <span className="text-zinc-100">TaskFlow</span>
        </h1>
        <p className="max-w-md text-zinc-300">
          Manage projects and tasks with a simple, fast UI. Your session stays safe with
          refresh-token rotation.
        </p>
        <div className="space-y-2 text-sm text-zinc-300">
          {['Clean dashboard', 'Projects & members', 'Task board workflow'].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-200" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="animate-in fade-in zoom-in-95 w-full duration-300">
        <CardHeader>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="text-sm text-zinc-300">Use your account to access projects.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm text-zinc-300">Email</label>
              <Input placeholder="you@example.com" {...register('email')} />
              {errors.email?.message ? (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm text-zinc-300">Password</label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password?.message ? (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              ) : null}
            </div>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-zinc-300">
            No account?{' '}
            <Link className="text-zinc-100 underline" href="/register">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
