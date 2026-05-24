import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, uploadDocument } from '@/lib/server/documents';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';

type Params = { params: Promise<{ investmentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { investmentId } = await params;
    const data = await listDocuments(user, investmentId);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    requireOwner(user);
    const { investmentId } = await params;
    const formData = await req.formData();
    const data = await uploadDocument(user, investmentId, formData);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
