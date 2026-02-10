'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;
type User = { id: string; email: string; name: string; role: 'ADMIN' | 'USER' };

export default function RegisterPage() {
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
      const data = await apiFetch<{ user: User; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setAuth({ user: data.user, accessToken: data.accessToken });
      toast.success('Account created');
      router.push('/dashboard');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      toast.error(message);
      setError('email', { message });
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
      <div className="space-y-5">
        <Badge variant="info" className="gap-1">
          <UserPlus className="h-3.5 w-3.5" />
          Create your account
        </Badge>
        <h1 className="text-4xl font-semibold leading-tight">
          Start organizing work with <span className="text-zinc-100">TaskFlow</span>
        </h1>
        <p className="max-w-md text-zinc-300">
          Create projects, invite members, and track progress. Everything is already wired
          end-to-end.
        </p>
        <div className="space-y-2 text-sm text-zinc-300">
          {['Fast signup', 'Projects & tasks', 'Modern UI defaults'].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-200" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="animate-in fade-in zoom-in-95 w-full duration-300">
        <CardHeader>
          <h2 className="text-2xl font-semibold">Create account</h2>
          <p className="text-sm text-zinc-300">Get started in under a minute.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm text-zinc-300">Name</label>
              <Input placeholder="Your name" {...register('name')} />
              {errors.name?.message ? (
                <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm text-zinc-300">Email</label>
              <Input placeholder="you@example.com" {...register('email')} />
              {errors.email?.message ? (
                <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm text-zinc-300">Password</label>
              <Input type="password" placeholder="Min 8 characters" {...register('password')} />
              {errors.password?.message ? (
                <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
              ) : null}
            </div>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-zinc-300">
            Already have an account?{' '}
            <Link className="text-zinc-100 underline" href="/login">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
