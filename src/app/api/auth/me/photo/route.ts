import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { handleApiError, requireAuth } from '@/lib/server/auth';
import { storagePathFor, uploadFile } from '@/lib/server/storage';

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp'];

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const formData = await req.formData();
    const file = formData.get('photo') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json({ error: 'Image must be JPG, PNG, or WebP' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5 MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = storagePathFor(user.id, ext);
    const photoUrl = await uploadFile('avatars', storagePath, buffer, file.type);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { photoUrl },
      select: { id: true, email: true, name: true, role: true, phone: true, photoUrl: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
