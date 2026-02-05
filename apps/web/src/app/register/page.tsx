'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await apiFetch<{ user: any; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setAuth({ user: data.user, accessToken: data.accessToken });
      router.push('/dashboard');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError('email', { message: e.message ?? 'Registration failed' });
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-zinc-300">Get started in under a minute.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm text-zinc-300">Name</label>
              <Input placeholder="Your name" {...register('name')} />
              {errors.name?.message && <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm text-zinc-300">Email</label>
              <Input placeholder="you@example.com" {...register('email')} />
              {errors.email?.message && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm text-zinc-300">Password</label>
              <Input type="password" placeholder="Min 8 characters" {...register('password')} />
              {errors.password?.message && <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>}
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
