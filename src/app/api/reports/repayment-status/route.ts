import { NextRequest, NextResponse } from 'next/server';
import { repaymentStatusReport } from '@/lib/server/reports';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const data = await repaymentStatusReport();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
