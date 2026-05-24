import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { sendOverdueAlertEmail, sendRepaymentReminderEmail } from '@/lib/email';

async function hasRecentNotification(
  userId: string,
  investmentId: string,
  type: NotificationType,
  withinDays: number,
) {
  const since = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000);
  const count = await prisma.notification.count({
    where: { userId, investmentId, type, createdAt: { gte: since } },
  });
  return count > 0;
}

async function notifyUser(
  userId: string,
  investmentId: string,
  type: NotificationType,
  title: string,
  message: string,
) {
  await prisma.notification.create({
    data: { userId, investmentId, type, title, message },
  });
}

export async function runNotificationAutomation() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER', isActive: true } });

  const activeInvestments = await prisma.investment.findMany({
    where: { status: 'ACTIVE', nextRepaymentDate: { not: null } },
    include: {
      recipient: { select: { id: true, name: true, email: true } },
    },
  });

  let dueReminders = 0;
  let overdueAlerts = 0;
  let defaulted = 0;

  for (const inv of activeInvestments) {
    const dueDate = new Date(inv.nextRepaymentDate!);
    const outstanding = Number(inv.principalAmount) - Number(inv.totalRepaid);
    const dueLabel = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const amountLabel = `OMR ${outstanding.toFixed(3)}`;

    // Due within 7 days (not yet overdue)
    if (dueDate >= now && dueDate <= in7Days) {
      const title = 'Repayment Due Soon';
      const message = `Repayment for "${inv.title}" is due on ${dueLabel}. Outstanding: ${amountLabel}.`;

      if (!(await hasRecentNotification(inv.recipientId, inv.id, 'REPAYMENT_DUE', 6))) {
        await notifyUser(inv.recipientId, inv.id, 'REPAYMENT_DUE', title, message);
        dueReminders++;
        try {
          await sendRepaymentReminderEmail(inv.recipient.email, inv.recipient.name, inv.title, dueLabel, amountLabel);
        } catch (e) {
          console.error('Due reminder email failed:', e);
        }
      }

      if (owner && !(await hasRecentNotification(owner.id, inv.id, 'REPAYMENT_DUE', 6))) {
        await notifyUser(owner.id, inv.id, 'REPAYMENT_DUE', title, message);
      }
    }

    // Overdue
    if (dueDate < now) {
      const title = 'Payment Overdue';
      const message = `Repayment for "${inv.title}" was due on ${dueLabel}. Outstanding: ${amountLabel}.`;

      if (!(await hasRecentNotification(inv.recipientId, inv.id, 'PAYMENT_OVERDUE', 1))) {
        await notifyUser(inv.recipientId, inv.id, 'PAYMENT_OVERDUE', title, message);
        overdueAlerts++;
      }

      if (owner && !(await hasRecentNotification(owner.id, inv.id, 'PAYMENT_OVERDUE', 1))) {
        await notifyUser(owner.id, inv.id, 'PAYMENT_OVERDUE', title, message);
        try {
          await sendOverdueAlertEmail(owner.email, owner.name, inv.title, inv.recipient.name, dueLabel, amountLabel);
        } catch (e) {
          console.error('Overdue alert email failed:', e);
        }
      }

      // Mark as defaulted if overdue and still active
      if (inv.status === 'ACTIVE') {
        await prisma.investment.update({
          where: { id: inv.id },
          data: { status: 'DEFAULTED' },
        });
        defaulted++;
      }
    }
  }

  return { dueReminders, overdueAlerts, defaulted, checked: activeInvestments.length };
}
