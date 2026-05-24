import prisma from '@/lib/prisma';
import { ApiError } from './auth';

export async function investmentSummaryReport(query: Record<string, string | undefined>) {
  const { from, to, status } = query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (from || to) {
    where.startDate = {};
    if (from) (where.startDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.startDate as Record<string, unknown>).lte = new Date(to);
  }

  const investments = await prisma.investment.findMany({
    where,
    include: {
      recipient: { select: { id: true, name: true, email: true } },
      _count: { select: { repayments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { investments, total: investments.length };
}

export async function profitReport(query: Record<string, string | undefined>) {
  const { from, to } = query;
  const where: Record<string, unknown> = {};
  if (from || to) {
    where.paymentDate = {};
    if (from) (where.paymentDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.paymentDate as Record<string, unknown>).lte = new Date(to);
  }

  const repayments = await prisma.repayment.findMany({
    where,
    include: { investment: { include: { recipient: { select: { id: true, name: true } } } } },
    orderBy: { paymentDate: 'desc' },
  });

  const totals = repayments.reduce(
    (acc, r) => ({
      totalAmount: acc.totalAmount + Number(r.amount),
      totalProfit: acc.totalProfit + Number(r.profitPortion),
      totalPrincipal: acc.totalPrincipal + Number(r.principalPortion),
    }),
    { totalAmount: 0, totalProfit: 0, totalPrincipal: 0 },
  );

  return { repayments, totals };
}

export async function repaymentStatusReport() {
  const investments = await prisma.investment.findMany({
    where: { status: { in: ['ACTIVE', 'DEFAULTED'] } },
    include: {
      recipient: { select: { id: true, name: true, email: true } },
      repayments: { orderBy: { paymentDate: 'desc' }, take: 1 },
    },
    orderBy: { nextRepaymentDate: 'asc' },
  });

  return investments.map((inv) => ({
    id: inv.id,
    title: inv.title,
    recipient: inv.recipient,
    principalAmount: inv.principalAmount,
    totalRepaid: inv.totalRepaid,
    outstanding: Number(inv.principalAmount) - Number(inv.totalRepaid),
    nextRepaymentDate: inv.nextRepaymentDate,
    lastPaymentDate: inv.repayments[0]?.paymentDate || null,
    status: inv.status,
    isOverdue: inv.nextRepaymentDate ? new Date(inv.nextRepaymentDate) < new Date() : false,
  }));
}

export async function recipientReport(recipientId: string) {
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!recipient) throw new ApiError(404, 'Recipient not found');

  const investments = await prisma.investment.findMany({
    where: { recipientId },
    include: { repayments: { orderBy: { paymentDate: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  const summary = {
    totalInvested: investments.reduce((s, i) => s + Number(i.principalAmount), 0),
    totalRepaid: investments.reduce((s, i) => s + Number(i.totalRepaid), 0),
    totalProfit: investments.reduce((s, i) => s + Number(i.totalProfitReceived), 0),
  };

  return { recipient, investments, summary };
}
