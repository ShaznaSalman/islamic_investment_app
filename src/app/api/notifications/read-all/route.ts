import { NextRequest, NextResponse } from 'next/server';
import { markAllAsRead } from '@/lib/server/notifications';
import { handleApiError, requireAuth } from '@/lib/server/auth';

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const data = await markAllAsRead(user);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
