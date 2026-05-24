import { NextRequest, NextResponse } from 'next/server';
import { profitReport } from '@/lib/server/reports';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const data = await profitReport(params);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
