import path from 'path';
import prisma from '@/lib/prisma';
import { ApiError, AuthUser } from './auth';
import { deleteStoredFile, storagePathFor, uploadFile } from './storage';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

async function assertInvestmentAccess(user: AuthUser, investmentId: string) {
  const investment = await prisma.investment.findUnique({ where: { id: investmentId } });
  if (!investment) throw new ApiError(404, 'Investment not found');
  if (user.role === 'RECIPIENT' && investment.recipientId !== user.id) {
    throw new ApiError(403, 'Access denied');
  }
  return investment;
}

export async function listDocuments(user: AuthUser, investmentId: string) {
  await assertInvestmentAccess(user, investmentId);
  return prisma.document.findMany({
    where: { investmentId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function uploadDocument(user: AuthUser, investmentId: string, formData: FormData) {
  const file = formData.get('file') as File | null;
  if (!file) throw new ApiError(400, 'No file uploaded');

  const investment = await prisma.investment.findUnique({ where: { id: investmentId } });
  if (!investment) throw new ApiError(404, 'Investment not found');

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ApiError(400, 'File type not allowed');
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new ApiError(400, 'File too large (max 20 MB)');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = storagePathFor(investmentId, ext);
  const fileUrl = await uploadFile('documents', storagePath, buffer, file.type);

  const name = (formData.get('name') as string) || file.name;
  const doc = await prisma.document.create({
    data: {
      investmentId,
      name,
      fileUrl,
      fileType: file.type,
      fileSizeBytes: file.size,
    },
  });

  await prisma.notification.create({
    data: {
      userId: investment.recipientId,
      investmentId,
      type: 'DOCUMENT_ADDED',
      title: 'New Document Available',
      message: `A new document "${name}" has been added to investment "${investment.title}".`,
    },
  });

  return doc;
}

export async function deleteDocument(investmentId: string, id: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.investmentId !== investmentId) {
    throw new ApiError(404, 'Document not found');
  }

  try {
    await deleteStoredFile('documents', doc.fileUrl);
  } catch (e) {
    console.error('Failed to delete file:', e);
  }

  await prisma.document.delete({ where: { id } });
  return { message: 'Document deleted' };
}

export async function acknowledgeDocument(user: AuthUser, investmentId: string, id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { investment: true },
  });
  if (!doc || doc.investmentId !== investmentId) {
    throw new ApiError(404, 'Document not found');
  }
  if (user.role === 'RECIPIENT' && doc.investment.recipientId !== user.id) {
    throw new ApiError(403, 'Access denied');
  }

  return prisma.document.update({
    where: { id },
    data: { isAcknowledged: true, acknowledgedAt: new Date() },
  });
}
