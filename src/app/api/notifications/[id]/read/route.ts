import { NextRequest, NextResponse } from 'next/server';
import { markAsRead } from '@/lib/server/notifications';
import { handleApiError, requireAuth } from '@/lib/server/auth';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const data = await markAsRead(user, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
