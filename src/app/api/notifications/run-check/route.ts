import { NextRequest, NextResponse } from 'next/server';
import { runNotificationAutomation } from '@/lib/server/automation';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const result = await runNotificationAutomation();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
