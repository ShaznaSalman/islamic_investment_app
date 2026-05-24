import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { handleApiError, requireAuth } from '@/lib/server/auth';

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords required' }, { status: 400 });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
