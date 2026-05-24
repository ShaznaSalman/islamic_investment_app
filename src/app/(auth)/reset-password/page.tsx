'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!token) {
      setError('Invalid reset link. Request a new one.');
      return;
    }
    setError('');
    try {
      await api.post('/api/auth/reset-password', { token, password: data.password });
      setDone(true);
      setTimeout(() => router.replace('/login'), 2000);
    } catch {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-600">This reset link is invalid.</p>
        <Link href="/forgot-password" className="text-sm text-primary-700 hover:underline">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-green-700 font-medium">Password updated. Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type="password" required error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Set New Password</Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-primary-900">IIA</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Choose New Password</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<p className="text-sm text-gray-400 text-center">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
          <p className="mt-4 text-center">
            <Link href="/login" className="text-xs text-primary-700 hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
