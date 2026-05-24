import { NextRequest, NextResponse } from 'next/server';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/server/settings';
import { handleApiError, requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const notifications = await getNotificationPreferences(user.id);
    return NextResponse.json({ notifications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const notifications = await updateNotificationPreferences(user, body.notifications ?? body);
    return NextResponse.json({ notifications });
  } catch (error) {
    return handleApiError(error);
  }
}
