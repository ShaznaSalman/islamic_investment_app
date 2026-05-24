import { NextRequest, NextResponse } from 'next/server';
import { createUser, listUsers } from '@/lib/server/users';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const data = await listUsers(params);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const body = await req.json();
    const data = await createUser(user, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
