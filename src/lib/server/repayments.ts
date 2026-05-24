import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import { ApiError, AuthUser } from './auth';

async function assertInvestmentAccess(user: AuthUser, investmentId: string) {
  const investment = await prisma.investment.findUnique({ where: { id: investmentId } });
  if (!investment) throw new ApiError(404, 'Investment not found');
  if (user.role === 'RECIPIENT' && investment.recipientId !== user.id) {
    throw new ApiError(403, 'Access denied');
  }
  return investment;
}

export async function listRepayments(user: AuthUser, investmentId: string) {
  await assertInvestmentAccess(user, investmentId);
  return prisma.repayment.findMany({
    where: { investmentId },
    orderBy: { paymentDate: 'desc' },
  });
}

export async function createRepayment(
  user: AuthUser,
  investmentId: string,
  body: Record<string, unknown>,
  receiptUrl?: string | null,
) {
  const { amount, principalPortion, profitPortion, paymentDate, notes } = body;
  const investment = await assertInvestmentAccess(user, investmentId);

  const repayment = await prisma.repayment.create({
    data: {
      investmentId,
      amount: amount as number,
      principalPortion: (principalPortion as number) || 0,
      profitPortion: (profitPortion as number) || 0,
      paymentDate: new Date(String(paymentDate)),
      notes: notes ? String(notes) : null,
      receiptUrl: receiptUrl ?? null,
    },
  });

  const newTotalRepaid = new Decimal(investment.totalRepaid).plus(new Decimal(String(amount)));
  const newTotalProfit = new Decimal(investment.totalProfitReceived).plus(new Decimal(String(profitPortion || 0)));
  const isFullyRepaid = newTotalRepaid.gte(new Decimal(investment.principalAmount));

  const updateData: Record<string, unknown> = {
    totalRepaid: newTotalRepaid,
    totalProfitReceived: newTotalProfit,
    isFullyRepaid,
  };
  if (isFullyRepaid) updateData.status = 'COMPLETED';

  await prisma.investment.update({ where: { id: investmentId }, data: updateData });

  if (isFullyRepaid) {
    await prisma.notification.create({
      data: {
        userId: investment.recipientId,
        investmentId,
        type: 'INVESTMENT_COMPLETED',
        title: 'Investment Completed',
        message: `Investment "${investment.title}" has been fully repaid and is now closed.`,
      },
    });
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'CREATE', entity: 'Repayment', entityId: repayment.id },
  });

  return repayment;
}

export async function updateRepayment(user: AuthUser, investmentId: string, id: string, body: Record<string, unknown>) {
  const { amount, principalPortion, profitPortion, paymentDate, notes } = body;
  const existing = await prisma.repayment.findUnique({ where: { id }, include: { investment: true } });
  if (!existing || existing.investmentId !== investmentId) {
    throw new ApiError(404, 'Repayment not found');
  }

  const repayment = await prisma.repayment.update({
    where: { id },
    data: {
      amount: amount as number,
      principalPortion: principalPortion as number,
      profitPortion: profitPortion as number,
      paymentDate: new Date(String(paymentDate)),
      notes: notes ? String(notes) : null,
    },
  });

  const allRepayments = await prisma.repayment.findMany({ where: { investmentId } });
  const totalRepaid = allRepayments.reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));
  const totalProfit = allRepayments.reduce((sum, r) => sum.plus(new Decimal(r.profitPortion)), new Decimal(0));
  const isFullyRepaid = totalRepaid.gte(new Decimal(existing.investment.principalAmount));

  await prisma.investment.update({
    where: { id: investmentId },
    data: {
      totalRepaid,
      totalProfitReceived: totalProfit,
      isFullyRepaid,
      status: isFullyRepaid ? 'COMPLETED' : undefined,
    },
  });

  return repayment;
}

export async function deleteRepayment(user: AuthUser, investmentId: string, id: string) {
  const existing = await prisma.repayment.findUnique({ where: { id }, include: { investment: true } });
  if (!existing || existing.investmentId !== investmentId) {
    throw new ApiError(404, 'Repayment not found');
  }

  await prisma.repayment.delete({ where: { id } });

  const allRepayments = await prisma.repayment.findMany({ where: { investmentId } });
  const totalRepaid = allRepayments.reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));
  const totalProfit = allRepayments.reduce((sum, r) => sum.plus(new Decimal(r.profitPortion)), new Decimal(0));
  const isFullyRepaid = totalRepaid.gte(new Decimal(existing.investment.principalAmount));

  await prisma.investment.update({
    where: { id: investmentId },
    data: { totalRepaid, totalProfitReceived: totalProfit, isFullyRepaid },
  });

  return { message: 'Repayment deleted' };
}
