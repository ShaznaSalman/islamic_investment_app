import { NextRequest, NextResponse } from 'next/server';
import { recipientReport } from '@/lib/server/reports';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ recipientId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { recipientId } = await params;
    const data = await recipientReport(recipientId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
