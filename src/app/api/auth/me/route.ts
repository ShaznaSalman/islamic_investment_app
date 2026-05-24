import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError, requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, phone: true, photoUrl: true, createdAt: true },
  });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(dbUser);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
  const { name, phone } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name, phone },
    select: { id: true, email: true, name: true, role: true, phone: true, photoUrl: true },
  });
  return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
