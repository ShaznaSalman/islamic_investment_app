import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getRecipientDashboardStats } from '@/lib/server/investments';
import { handleApiError, requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const data = user.role === 'OWNER'
      ? await getDashboardStats()
      : await getRecipientDashboardStats(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
