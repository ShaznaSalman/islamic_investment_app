import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/server/audit';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10);
    const logs = await listAuditLogs(limit);
    return NextResponse.json(logs);
  } catch (error) {
    return handleApiError(error);
  }
}
