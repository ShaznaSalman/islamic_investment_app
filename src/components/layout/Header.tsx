'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface HeaderProps {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function Header({ title, breadcrumb }: HeaderProps) {
  const { data } = useNotifications();
  const unreadCount = data?.unreadCount || 0;

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary-700 transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-gray-600">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/notifications" className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
