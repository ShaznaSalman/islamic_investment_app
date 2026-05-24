import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { ApiError, AuthUser } from './auth';

export async function listUsers(query: Record<string, string | undefined>) {
  const { role, search } = query;
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.user.findMany({
    where,
    select: {
      id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true, phone: true, isActive: true, photoUrl: true, createdAt: true,
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function createUser(actor: AuthUser, body: Record<string, unknown>) {
  const { email, password, name, role, phone } = body as {
    email: string; password: string; name: string; role: 'OWNER' | 'RECIPIENT'; phone?: string;
  };

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'Email already in use');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: hashed, name, role, phone },
    select: {
      id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'CREATE', entity: 'User', entityId: user.id },
  });

  return user;
}

export async function updateUser(id: string, body: Record<string, unknown>) {
  const { name, phone, isActive, role } = body;
  return prisma.user.update({
    where: { id },
    data: {
      name: name as string | undefined,
      phone: phone as string | undefined,
      isActive: isActive as boolean | undefined,
      role: role as 'OWNER' | 'RECIPIENT' | undefined,
    },
    select: {
      id: true, email: true, name: true, role: true, phone: true, isActive: true,
    },
  });
}

export async function resetUserPassword(id: string, password: string) {
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  return { message: 'Password reset successfully' };
}
