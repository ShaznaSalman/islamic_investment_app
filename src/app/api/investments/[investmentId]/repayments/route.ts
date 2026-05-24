import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createRepayment, listRepayments } from '@/lib/server/repayments';
import { handleApiError, requireAuth, requireOwner } from '@/lib/server/auth';
import { storagePathFor, uploadFile } from '@/lib/server/storage';

type Params = { params: Promise<{ investmentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { investmentId } = await params;
    const data = await listRepayments(user, investmentId);
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

    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown>;
    let receiptUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        amount: formData.get('amount'),
        principalPortion: formData.get('principalPortion') || 0,
        profitPortion: formData.get('profitPortion') || 0,
        paymentDate: formData.get('paymentDate'),
        notes: formData.get('notes'),
      };
      const receipt = formData.get('receipt') as File | null;
      if (receipt && receipt.size > 0) {
        const ext = path.extname(receipt.name).toLowerCase();
        const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
        if (!allowed.includes(ext)) {
          return NextResponse.json({ error: 'Receipt must be PDF or image' }, { status: 400 });
        }
        const buffer = Buffer.from(await receipt.arrayBuffer());
        const storagePath = storagePathFor(`receipts/${investmentId}`, ext);
        receiptUrl = await uploadFile('receipts', storagePath, buffer, receipt.type);
      }
    } else {
      body = await req.json();
    }

    const data = await createRepayment(user, investmentId, body, receiptUrl);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
