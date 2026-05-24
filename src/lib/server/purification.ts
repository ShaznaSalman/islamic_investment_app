import prisma from '@/lib/prisma';
import { ApiError } from './auth';

export async function listPurificationRecords() {
  return prisma.purificationRecord.findMany({ orderBy: { donationDate: 'desc' } });
}

export async function createPurificationRecord(body: Record<string, unknown>) {
  const { amount, currencyCode, donationDate, donatedTo, purpose, notes } = body;

  if (!amount || !donationDate) {
    throw new ApiError(400, 'Amount and donation date are required');
  }

  return prisma.purificationRecord.create({
    data: {
      amount: Number(amount),
      currencyCode: currencyCode ? String(currencyCode) : 'OMR',
      donationDate: new Date(String(donationDate)),
      donatedTo: donatedTo ? String(donatedTo) : null,
      purpose: purpose ? String(purpose) : null,
      notes: notes ? String(notes) : null,
    },
  });
}

export async function deletePurificationRecord(id: string) {
  const record = await prisma.purificationRecord.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, 'Record not found');
  await prisma.purificationRecord.delete({ where: { id } });
  return { message: 'Record deleted' };
}

export async function getPurificationSummary() {
  const records = await prisma.purificationRecord.findMany();
  const totalPurified = records.reduce((s, r) => s + Number(r.amount), 0);
  return { totalPurified, count: records.length };
}
