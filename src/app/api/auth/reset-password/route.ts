import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
  if (!user) return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetTokenExpiry: null } });
  return NextResponse.json({ message: 'Password reset successfully' });
}
