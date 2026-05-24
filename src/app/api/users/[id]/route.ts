import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateUser } from '@/lib/server/users';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { id } = await params;
    const data = await getUser(id);
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
    const data = await updateUser(id, body);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
