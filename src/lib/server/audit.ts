import prisma from '@/lib/prisma';

export async function listAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
