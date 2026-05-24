import { NextRequest, NextResponse } from 'next/server';
import {
  deleteInvestment,
  getInvestment,
  updateInvestment,
} from '@/lib/server/investments';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const data = await getInvestment(user, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { id } = await params;
    const body = await req.json();
    const data = await updateInvestment(user, id, body);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { id } = await params;
    const data = await deleteInvestment(user, id);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
