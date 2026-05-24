'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await login(data.email, data.password);
      router.replace('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-primary-900">IIA</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Islamic Investment App</h1>
          <p className="text-primary-300 text-sm mt-1">Shariah-Compliant Investment Management</p>
          <p className="text-primary-400 text-xs mt-3 font-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full mt-2" loading={isSubmitting} size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a href="/forgot-password" className="text-xs text-primary-700 hover:underline">
              Forgot your password?
            </a>
          </div>
        </div>

        <p className="text-center text-primary-400 text-xs mt-6">
          وَاللَّهُ خَيْرُ الرَّازِقِين — &ldquo;And Allah is the Best of Providers&rdquo;
        </p>
      </div>
    </div>
  );
}
