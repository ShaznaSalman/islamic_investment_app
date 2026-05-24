import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/lib/server/notifications';
import { handleApiError, requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';
    const data = await getNotifications(user, unreadOnly);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
