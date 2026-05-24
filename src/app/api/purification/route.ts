import { NextRequest, NextResponse } from 'next/server';
import {
  createPurificationRecord,
  getPurificationSummary,
  listPurificationRecords,
} from '@/lib/server/purification';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const [records, summary] = await Promise.all([
      listPurificationRecords(),
      getPurificationSummary(),
    ]);
    return NextResponse.json({ records, summary });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const body = await req.json();
    const record = await createPurificationRecord(body);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
