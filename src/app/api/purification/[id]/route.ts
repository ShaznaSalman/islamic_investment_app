import { NextRequest, NextResponse } from 'next/server';
import { deletePurificationRecord } from '@/lib/server/purification';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { id } = await params;
    const data = await deletePurificationRecord(id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
