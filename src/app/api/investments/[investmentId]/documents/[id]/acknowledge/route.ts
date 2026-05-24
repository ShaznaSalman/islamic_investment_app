import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeDocument } from '@/lib/server/documents';
import { handleApiError, requireAuth } from '@/lib/server/auth';

type Params = { params: Promise<{ investmentId: string; id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { investmentId, id } = await params;
    const data = await acknowledgeDocument(user, investmentId, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
