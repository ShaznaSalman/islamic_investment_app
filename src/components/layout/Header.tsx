'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface HeaderProps {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  const { data } = useNotifications();
  const { logout } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="mb-0.5 flex min-w-0 flex-wrap items-center gap-1 text-xs text-gray-400">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary-700 transition-colors">{crumb.label}</Link>
                  ) : (
                    <span className="truncate text-gray-600">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/notifications" className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/settings" className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden" aria-label="Settings">
            <Settings size={20} />
          </Link>
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Sign out?"
        message="You will need to sign in again to access your account."
        confirmLabel="Sign out"
        variant="danger"
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
      />
    </>
  );
}
