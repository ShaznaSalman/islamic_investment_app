require('./load-env-local');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const counts = {
    users: await prisma.user.count(),
    investments: await prisma.investment.count(),
    repayments: await prisma.repayment.count(),
    documents: await prisma.document.count(),
    notifications: await prisma.notification.count(),
    purificationRecords: await prisma.purificationRecord.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log('Table row counts:', counts);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
