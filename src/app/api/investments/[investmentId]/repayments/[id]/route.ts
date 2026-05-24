import { NextRequest, NextResponse } from 'next/server';
import { deleteRepayment, updateRepayment } from '@/lib/server/repayments';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ investmentId: string; id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { investmentId, id } = await params;
    const body = await req.json();
    const data = await updateRepayment(user, investmentId, id, body);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { investmentId, id } = await params;
    const data = await deleteRepayment(user, investmentId, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
