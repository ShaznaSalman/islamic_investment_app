'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  LayoutDashboard, TrendingUp, Calculator, Users,
  FileText, BarChart3, Bell, Settings, LogOut, Briefcase,
} from 'lucide-react';

const ownerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/investments', label: 'Investments', icon: TrendingUp },
  { href: '/recipients', label: 'Recipients', icon: Users },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/documents', label: 'Documents', icon: Briefcase },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const recipientNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/investments', label: 'My Investments', icon: TrendingUp },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const nav = user?.role === 'OWNER' ? ownerNav : recipientNav;
  const mobileNav = nav.slice(0, 5);

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-primary-900 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center text-primary-900 font-bold text-sm">
              IIA
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Islamic Investment</p>
              <p className="text-xs text-primary-300 leading-tight">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                )}
              >
                <Icon size={18} className={active ? 'text-gold-400' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="px-3 py-4 border-t border-primary-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-primary-300 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-200 hover:bg-primary-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-800 bg-primary-950/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 text-white shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-medium transition-colors',
                  active ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                )}
              >
                <Icon size={18} className={active ? 'text-gold-400' : ''} />
                <span className="w-full truncate text-center">{label.replace('My ', '')}</span>
              </Link>
            );
          })}
        </div>
      </nav>

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
