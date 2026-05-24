import { NextRequest, NextResponse } from 'next/server';
import {
  deleteInvestment,
  getInvestment,
  updateInvestment,
} from '@/lib/server/investments';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ investmentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { investmentId } = await params;
    const data = await getInvestment(user, investmentId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { investmentId } = await params;
    const body = await req.json();
    const data = await updateInvestment(user, investmentId, body);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { investmentId } = await params;
    const data = await deleteInvestment(user, investmentId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
