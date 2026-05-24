import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { appUrl } from '@/lib/server/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiry: expiry } });
  const resetUrl = `${appUrl()}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);
  return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
}
