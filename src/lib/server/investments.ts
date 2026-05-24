import { InvestmentStatus, InvestmentType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { sendNewInvestmentEmail } from '@/lib/email';
import { ApiError, AuthUser } from './auth';

export async function listInvestments(
  user: AuthUser,
  query: Record<string, string | undefined>,
) {
  const { status, type, recipientId, search, from, to, page = '1', limit = '20' } = query;
  const where: Record<string, unknown> = {};

  if (user.role === 'RECIPIENT') {
    where.recipientId = user.id;
  } else if (recipientId) {
    where.recipientId = recipientId;
  }

  if (status) where.status = status as InvestmentStatus;
  if (type) where.type = type as InvestmentType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { purpose: { contains: search, mode: 'insensitive' } },
      { recipient: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (from || to) {
    where.startDate = {};
    if (from) (where.startDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.startDate as Record<string, unknown>).lte = new Date(to);
  }

  const pageNum = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({
      where,
      include: {
        recipient: { select: { id: true, name: true, email: true, phone: true } },
        _count: { select: { repayments: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.investment.count({ where }),
  ]);

  return { investments, total, page: pageNum, totalPages: Math.ceil(total / pageSize) };
}

export async function getInvestment(user: AuthUser, id: string) {
  const investment = await prisma.investment.findUnique({
    where: { id },
    include: {
      recipient: { select: { id: true, name: true, email: true, phone: true } },
      repayments: { orderBy: { paymentDate: 'desc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  });

  if (!investment) throw new ApiError(404, 'Investment not found');
  if (user.role === 'RECIPIENT' && investment.recipientId !== user.id) {
    throw new ApiError(403, 'Access denied');
  }

  return investment;
}

export async function createInvestment(user: AuthUser, body: Record<string, unknown>) {
  const {
    title, recipientId, type, principalAmount, ownerProfitRatio, recipientProfitRatio,
    startDate, endDate, purpose, notes, shariaAdvisorNotes, nextRepaymentDate,
    lossHandlingAcknowledged, lossHandlingNotes,
  } = body as Record<string, string | number | boolean>;

  if (Number(ownerProfitRatio) + Number(recipientProfitRatio) !== 100) {
    throw new ApiError(400, 'Profit ratios must sum to 100');
  }
  if (lossHandlingAcknowledged !== 'true' && lossHandlingAcknowledged !== true) {
    throw new ApiError(400, 'Loss handling must be acknowledged before creating an investment');
  }
  if (!lossHandlingNotes || String(lossHandlingNotes).trim().length < 10) {
    throw new ApiError(400, 'Loss handling notes are required');
  }

  const recipient = await prisma.user.findUnique({ where: { id: String(recipientId) } });
  if (!recipient) throw new ApiError(404, 'Recipient not found');

  const investment = await prisma.investment.create({
    data: {
      title: String(title),
      recipientId: String(recipientId),
      type: type as InvestmentType,
      principalAmount: Number(principalAmount),
      ownerProfitRatio: Number(ownerProfitRatio),
      recipientProfitRatio: Number(recipientProfitRatio),
      startDate: new Date(String(startDate)),
      endDate: endDate ? new Date(String(endDate)) : null,
      nextRepaymentDate: nextRepaymentDate ? new Date(String(nextRepaymentDate)) : null,
      purpose: purpose ? String(purpose) : null,
      notes: [
        notes ? String(notes) : '',
        `Loss handling: ${String(lossHandlingNotes)}`,
      ].filter(Boolean).join('\n\n') || null,
      shariaAdvisorNotes: shariaAdvisorNotes ? String(shariaAdvisorNotes) : null,
    },
    include: {
      recipient: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: String(recipientId),
      investmentId: investment.id,
      type: 'NEW_INVESTMENT',
      title: 'New Investment Assigned',
      message: `A new investment "${title}" has been assigned to you.`,
    },
  });

  try {
    await sendNewInvestmentEmail(recipient.email, recipient.name, String(title));
  } catch (e) {
    console.error('Email notification failed:', e);
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'CREATE', entity: 'Investment', entityId: investment.id },
  });

  return investment;
}

export async function updateInvestment(user: AuthUser, id: string, body: Record<string, unknown>) {
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) throw new ApiError(404, 'Investment not found');

  const {
    title, type, principalAmount, ownerProfitRatio, recipientProfitRatio,
    startDate, endDate, purpose, notes, shariaAdvisorNotes, status, nextRepaymentDate,
  } = body;

  if (ownerProfitRatio !== undefined && recipientProfitRatio !== undefined) {
    if (Number(ownerProfitRatio) + Number(recipientProfitRatio) !== 100) {
      throw new ApiError(400, 'Profit ratios must sum to 100');
    }
  }

  const updated = await prisma.investment.update({
    where: { id },
    data: {
      title: title as string | undefined,
      type: type as InvestmentType | undefined,
      principalAmount: principalAmount as number | undefined,
      ownerProfitRatio: ownerProfitRatio as number | undefined,
      recipientProfitRatio: recipientProfitRatio as number | undefined,
      status: status as InvestmentStatus | undefined,
      startDate: startDate ? new Date(String(startDate)) : undefined,
      endDate: endDate ? new Date(String(endDate)) : null,
      nextRepaymentDate: nextRepaymentDate ? new Date(String(nextRepaymentDate)) : null,
      purpose: purpose as string | undefined,
      notes: notes as string | undefined,
      shariaAdvisorNotes: shariaAdvisorNotes as string | undefined,
    },
    include: {
      recipient: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'UPDATE', entity: 'Investment', entityId: id },
  });

  return updated;
}

export async function deleteInvestment(user: AuthUser, id: string) {
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) throw new ApiError(404, 'Investment not found');

  await prisma.investment.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'DELETE', entity: 'Investment', entityId: id },
  });

  return { message: 'Investment deleted' };
}

export async function getRecipientDashboardStats(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { recipientId: userId },
    include: {
      repayments: { orderBy: { paymentDate: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusCounts = investments.reduce(
    (acc, inv) => ({ ...acc, [inv.status]: (acc[inv.status] || 0) + 1 }),
    { PENDING: 0, ACTIVE: 0, COMPLETED: 0, DEFAULTED: 0 } as Record<string, number>,
  );

  const totalInvested = investments.reduce((s, i) => s + Number(i.principalAmount), 0);
  const totalRepaid = investments.reduce((s, i) => s + Number(i.totalRepaid), 0);
  const outstanding = totalInvested - totalRepaid;

  const activeWithDue = investments
    .filter((i) => i.status === 'ACTIVE' && i.nextRepaymentDate)
    .sort((a, b) => new Date(a.nextRepaymentDate!).getTime() - new Date(b.nextRepaymentDate!).getTime());

  const nextDue = activeWithDue[0] ?? null;
  const overdueCount = activeWithDue.filter(
    (i) => i.nextRepaymentDate && new Date(i.nextRepaymentDate) < new Date(),
  ).length;

  const recentPayments = investments
    .flatMap((i) =>
      i.repayments.map((r) => ({
        id: r.id,
        amount: r.amount,
        paymentDate: r.paymentDate,
        investmentTitle: i.title,
        investmentId: i.id,
      })),
    )
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  return {
    statusCounts,
    totalInvested,
    totalRepaid,
    outstanding,
    overdueCount,
    nextDue: nextDue
      ? {
          investmentId: nextDue.id,
          title: nextDue.title,
          date: nextDue.nextRepaymentDate,
          amount: Number(nextDue.principalAmount) - Number(nextDue.totalRepaid),
          ownerProfitRatio: nextDue.ownerProfitRatio,
          recipientProfitRatio: nextDue.recipientProfitRatio,
        }
      : null,
    recentInvestments: investments.slice(0, 5),
    recentPayments,
  };
}

export async function getDashboardStats() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [counts, totals, upcomingIn7, upcomingIn30, recentInvestments] = await Promise.all([
    prisma.investment.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.investment.aggregate({
      _sum: { principalAmount: true, totalRepaid: true, totalProfitReceived: true },
    }),
    prisma.investment.count({
      where: { status: 'ACTIVE', nextRepaymentDate: { gte: now, lte: in7Days } },
    }),
    prisma.investment.count({
      where: { status: 'ACTIVE', nextRepaymentDate: { gte: now, lte: in30Days } },
    }),
    prisma.investment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { recipient: { select: { id: true, name: true } } },
    }),
  ]);

  const statusCounts = counts.reduce(
    (acc, row) => ({ ...acc, [row.status]: row._count.id }),
    {} as Record<string, number>,
  );

  return {
    statusCounts: {
      PENDING: statusCounts.PENDING || 0,
      ACTIVE: statusCounts.ACTIVE || 0,
      COMPLETED: statusCounts.COMPLETED || 0,
      DEFAULTED: statusCounts.DEFAULTED || 0,
    },
    totalInvested: totals._sum.principalAmount || 0,
    totalRepaid: totals._sum.totalRepaid || 0,
    totalProfitReceived: totals._sum.totalProfitReceived || 0,
    upcomingIn7Days: upcomingIn7,
    upcomingIn30Days: upcomingIn30,
    recentInvestments,
  };
}
