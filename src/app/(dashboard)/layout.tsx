'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';

const OWNER_ONLY_PREFIXES = ['/investments/new', '/recipients', '/reports', '/calculator'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user || user.role === 'OWNER') return;
    const blocked = OWNER_ONLY_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (blocked) router.replace('/dashboard');
  }, [user, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-dvh bg-gray-50 lg:h-screen lg:overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-24 lg:overflow-y-auto lg:pb-0">
        {children}
      </main>
    </div>
  );
}
