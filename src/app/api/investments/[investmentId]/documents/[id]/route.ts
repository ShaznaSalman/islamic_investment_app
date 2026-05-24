import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/server/documents';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ investmentId: string; id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { investmentId, id } = await params;
    const data = await deleteDocument(investmentId, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
