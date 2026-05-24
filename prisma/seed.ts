import { PrismaClient, InvestmentStatus, InvestmentType, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…\n');

  const ownerPw = await bcrypt.hash('Admin@12345', 12);
  const recipientPw = await bcrypt.hash('Recipient@123', 12);
  const recipient2Pw = await bcrypt.hash('Recipient@123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@iia.com' },
    update: { name: 'Investment Owner', phone: '+968 9000 0001', isActive: true },
    create: {
      email: 'owner@iia.com',
      password: ownerPw,
      name: 'Investment Owner',
      role: 'OWNER',
      phone: '+968 9000 0001',
    },
  });

  const recipient1 = await prisma.user.upsert({
    where: { email: 'recipient@iia.com' },
    update: { name: 'Ahmed Al-Rashidi', phone: '+968 9000 0002', isActive: true },
    create: {
      email: 'recipient@iia.com',
      password: recipientPw,
      name: 'Ahmed Al-Rashidi',
      role: 'RECIPIENT',
      phone: '+968 9000 0002',
    },
  });

  const recipient2 = await prisma.user.upsert({
    where: { email: 'fatima@iia.com' },
    update: { name: 'Fatima Al-Balushi', phone: '+968 9000 0003', isActive: true },
    create: {
      email: 'fatima@iia.com',
      password: recipient2Pw,
      name: 'Fatima Al-Balushi',
      role: 'RECIPIENT',
      phone: '+968 9000 0003',
    },
  });

  const invActive = await prisma.investment.upsert({
    where: { id: 'seed-inv-active' },
    update: {},
    create: {
      id: 'seed-inv-active',
      title: 'Retail Trade — Ahmed Al-Rashidi',
      recipientId: recipient1.id,
      type: InvestmentType.MUDARABAH,
      status: InvestmentStatus.ACTIVE,
      principalAmount: 50000,
      ownerProfitRatio: 70,
      recipientProfitRatio: 30,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      purpose: 'Retail goods trading business',
      notes: 'Monthly profit-sharing. Reports due on the 1st of each month.',
      shariaAdvisorNotes: 'Approved as Mudarabah — capital at risk, profit share only.',
      nextRepaymentDate: new Date('2026-06-01'),
      totalRepaid: 13000,
      totalProfitReceived: 3000,
    },
  });

  const invPending = await prisma.investment.upsert({
    where: { id: 'seed-inv-pending' },
    update: {},
    create: {
      id: 'seed-inv-pending',
      title: 'Café Expansion — Fatima Al-Balushi',
      recipientId: recipient2.id,
      type: InvestmentType.MUSHARAKAH,
      status: InvestmentStatus.PENDING,
      principalAmount: 25000,
      ownerProfitRatio: 60,
      recipientProfitRatio: 40,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      purpose: 'Second branch fit-out and equipment',
      nextRepaymentDate: new Date('2026-08-01'),
    },
  });

  const invCompleted = await prisma.investment.upsert({
    where: { id: 'seed-inv-completed' },
    update: {},
    create: {
      id: 'seed-inv-completed',
      title: 'Qard Hassan — Ahmed (Education)',
      recipientId: recipient1.id,
      type: InvestmentType.QARD_HASSAN,
      status: InvestmentStatus.COMPLETED,
      principalAmount: 10000,
      ownerProfitRatio: 0,
      recipientProfitRatio: 0,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      purpose: 'Tuition support — interest-free loan',
      totalRepaid: 10000,
      totalProfitReceived: 0,
      isFullyRepaid: true,
    },
  });

  const invDefaulted = await prisma.investment.upsert({
    where: { id: 'seed-inv-defaulted' },
    update: {},
    create: {
      id: 'seed-inv-defaulted',
      title: 'Import Goods — Fatima (Overdue)',
      recipientId: recipient2.id,
      type: InvestmentType.MURABAHAH,
      status: InvestmentStatus.DEFAULTED,
      principalAmount: 15000,
      ownerProfitRatio: 50,
      recipientProfitRatio: 50,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2026-02-28'),
      purpose: 'Inventory financing',
      nextRepaymentDate: new Date('2026-03-01'),
      totalRepaid: 5000,
      totalProfitReceived: 800,
    },
  });

  const repayments = [
    {
      id: 'seed-repay-001',
      investmentId: invActive.id,
      amount: 6500,
      principalPortion: 5000,
      profitPortion: 1500,
      paymentDate: new Date('2026-02-01'),
      notes: 'January profit distribution',
    },
    {
      id: 'seed-repay-002',
      investmentId: invActive.id,
      amount: 6500,
      principalPortion: 5000,
      profitPortion: 1500,
      paymentDate: new Date('2026-03-01'),
      notes: 'February profit distribution',
    },
    {
      id: 'seed-repay-003',
      investmentId: invCompleted.id,
      amount: 10000,
      principalPortion: 10000,
      profitPortion: 0,
      paymentDate: new Date('2025-05-15'),
      notes: 'Final principal repayment',
    },
    {
      id: 'seed-repay-004',
      investmentId: invDefaulted.id,
      amount: 5000,
      principalPortion: 4200,
      profitPortion: 800,
      paymentDate: new Date('2025-12-01'),
      notes: 'Partial payment before default',
    },
  ];

  for (const r of repayments) {
    await prisma.repayment.upsert({ where: { id: r.id }, update: {}, create: r });
  }

  const documents = [
    {
      id: 'seed-doc-001',
      investmentId: invActive.id,
      name: 'Mudarabah Agreement — Ahmed',
      fileUrl: '/uploads/seed/mudarabah-agreement.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 245_000,
      isAcknowledged: true,
      acknowledgedAt: new Date('2026-01-05'),
    },
    {
      id: 'seed-doc-002',
      investmentId: invActive.id,
      name: 'January Profit Report',
      fileUrl: '/uploads/seed/jan-profit-report.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 128_000,
      isAcknowledged: false,
    },
    {
      id: 'seed-doc-003',
      investmentId: invPending.id,
      name: 'Musharakah Draft Contract',
      fileUrl: '/uploads/seed/musharakah-draft.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 312_000,
      isAcknowledged: false,
    },
    {
      id: 'seed-doc-004',
      investmentId: invDefaulted.id,
      name: 'Overdue Notice — March 2026',
      fileUrl: '/uploads/seed/overdue-notice.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 89_000,
      isAcknowledged: true,
      acknowledgedAt: new Date('2026-03-10'),
    },
  ];

  for (const d of documents) {
    await prisma.document.upsert({ where: { id: d.id }, update: {}, create: d });
  }

  const notifications = [
    {
      id: 'seed-notif-001',
      userId: owner.id,
      investmentId: invDefaulted.id,
      type: NotificationType.PAYMENT_OVERDUE,
      title: 'Payment overdue',
      message: 'Import Goods — Fatima has an overdue repayment since 1 Mar 2026.',
      isRead: false,
    },
    {
      id: 'seed-notif-002',
      userId: recipient1.id,
      investmentId: invActive.id,
      type: NotificationType.REPAYMENT_DUE,
      title: 'Repayment due soon',
      message: 'Retail Trade investment: next profit share due 1 Jun 2026.',
      isRead: false,
    },
    {
      id: 'seed-notif-003',
      userId: owner.id,
      investmentId: invPending.id,
      type: NotificationType.NEW_INVESTMENT,
      title: 'New investment pending',
      message: 'Café Expansion — Fatima is awaiting activation.',
      isRead: true,
    },
    {
      id: 'seed-notif-004',
      userId: recipient2.id,
      investmentId: invPending.id,
      type: NotificationType.DOCUMENT_ADDED,
      title: 'New document uploaded',
      message: 'Musharakah Draft Contract has been added to your investment.',
      isRead: false,
    },
    {
      id: 'seed-notif-005',
      userId: owner.id,
      investmentId: invCompleted.id,
      type: NotificationType.INVESTMENT_COMPLETED,
      title: 'Investment completed',
      message: 'Qard Hassan — Ahmed has been fully repaid.',
      isRead: true,
    },
    {
      id: 'seed-notif-006',
      userId: owner.id,
      type: NotificationType.GENERAL,
      title: 'Welcome to IIA',
      message: 'Your Islamic Investment App dashboard is ready.',
      isRead: true,
    },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({ where: { id: n.id }, update: {}, create: n });
  }

  const purifications = [
    {
      id: 'seed-purif-001',
      amount: 150,
      donationDate: new Date('2026-01-15'),
      donatedTo: 'Oman Charitable Organisation',
      purpose: 'Purification of doubtful income from late fee estimate',
      notes: 'Calculated per scholar guidance',
    },
    {
      id: 'seed-purif-002',
      amount: 75.5,
      donationDate: new Date('2026-04-01'),
      donatedTo: 'Local masjid sadaqah fund',
      purpose: 'Quarterly purification',
    },
  ];

  for (const p of purifications) {
    await prisma.purificationRecord.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  const auditLogs = [
    {
      id: 'seed-audit-001',
      userId: owner.id,
      action: 'CREATE',
      entity: 'Investment',
      entityId: invActive.id,
      details: { title: invActive.title },
    },
    {
      id: 'seed-audit-002',
      userId: owner.id,
      action: 'CREATE',
      entity: 'Repayment',
      entityId: 'seed-repay-001',
      details: { amount: 6500 },
    },
    {
      id: 'seed-audit-003',
      userId: owner.id,
      action: 'UPDATE',
      entity: 'Investment',
      entityId: invDefaulted.id,
      details: { status: 'DEFAULTED' },
    },
    {
      id: 'seed-audit-004',
      userId: owner.id,
      action: 'CREATE',
      entity: 'User',
      entityId: recipient2.id,
      details: { email: 'fatima@iia.com' },
    },
    {
      id: 'seed-audit-005',
      userId: owner.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: owner.id,
      details: { method: 'seed' },
    },
  ];

  for (const a of auditLogs) {
    await prisma.auditLog.upsert({ where: { id: a.id }, update: {}, create: a });
  }

  console.log('✅ Seed complete\n');
  console.log('── Logins ──────────────────────────────────────');
  console.log('  Owner:     owner@iia.com      / Admin@12345');
  console.log('  Recipient: recipient@iia.com / Recipient@123');
  console.log('  Recipient: fatima@iia.com     / Recipient@123');
  console.log('── Sample data ───────────────────────────────');
  console.log('  Investments: 4 (ACTIVE, PENDING, COMPLETED, DEFAULTED)');
  console.log('  Repayments:  4 | Documents: 4 | Notifications: 6');
  console.log('  Purification: 2 | Audit logs: 5');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
