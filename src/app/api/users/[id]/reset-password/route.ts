import { NextRequest, NextResponse } from 'next/server';
import { resetUserPassword } from '@/lib/server/users';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { id } = await params;
    const { password } = await req.json();
    const data = await resetUserPassword(id, password);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
