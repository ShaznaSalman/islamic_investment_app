import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/lib/server/settings';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    const data = await getSystemSettings();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const body = await req.json();
    const data = await updateSystemSettings(body);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
