import prisma from '@/lib/prisma';
import { ApiError, AuthUser } from './auth';

export async function getNotifications(user: AuthUser, unreadOnly: boolean) {
  const where: Record<string, unknown> = { userId: user.id };
  if (unreadOnly) where.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { investment: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return { notifications, unreadCount };
}

export async function markAsRead(user: AuthUser, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== user.id) {
    throw new ApiError(404, 'Notification not found');
  }
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return { message: 'Marked as read' };
}

export async function markAllAsRead(user: AuthUser) {
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return { message: 'All notifications marked as read' };
}
