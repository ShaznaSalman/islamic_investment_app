'use client';

import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Bell, BellOff, Check } from 'lucide-react';
import Link from 'next/link';
import { Notification, NotificationType } from '@/types';

const typeIcons: Record<NotificationType, string> = {
  REPAYMENT_DUE: '📅',
  PAYMENT_OVERDUE: '⚠️',
  NEW_INVESTMENT: '🤝',
  INVESTMENT_COMPLETED: '✅',
  DOCUMENT_ADDED: '📄',
  GENERAL: '🔔',
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const notifications: Notification[] = (data?.notifications as Notification[]) || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      <Header
        title="Notifications"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]}
      />
      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} className="w-full sm:w-auto">
              <Check size={14} /> Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader title="All Notifications" subtitle={`${notifications.length} total`} />
          <CardBody className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-gray-400 text-center">Loading…</p>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <BellOff size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-6 ${!n.isRead ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className="text-xl mt-0.5">{typeIcons[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          {!n.isRead && <Badge variant="primary">New</Badge>}
                          <span className="text-xs text-gray-400">{formatDate(n.createdAt, true)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                      {n.investment && (
                        <Link
                          href={`/investments/${n.investment.id}`}
                          className="text-xs text-primary-700 hover:underline mt-1 inline-block"
                        >
                          View investment →
                        </Link>
                      )}
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        className="p-1 text-gray-300 hover:text-primary-600 transition-colors mt-0.5"
                        title="Mark as read"
                      >
                        <Bell size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
