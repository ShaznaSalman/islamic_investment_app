'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({ email: z.string().email('Invalid email address') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-primary-900">IIA</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                If an account exists for that email, we sent a reset link. Check your inbox.
              </p>
              <Link href="/login" className="text-sm text-primary-700 font-medium hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we will send a reset link.</p>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                <Button type="submit" className="w-full" loading={isSubmitting}>Send Reset Link</Button>
              </form>
              <p className="mt-4 text-center">
                <Link href="/login" className="text-xs text-primary-700 hover:underline">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
