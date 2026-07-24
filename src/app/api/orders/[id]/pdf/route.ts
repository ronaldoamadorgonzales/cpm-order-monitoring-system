import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('x-user-id');
  const role = req.headers.get('x-role');
  if (!userId || !role) {
    return NextResponse.json(
      { success: false, error: { message: 'Not authorized.' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const orderId = BigInt(id);

    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found.' } },
        { status: 404 }
      );
    }

    // RLS Enforcement
    if (role !== 'ADMIN' && order.createdByUserId !== BigInt(userId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authorized to download this invoice.' } },
        { status: 403 }
      );
    }

    if (!order.pdfGeneratedFlag || !order.pdfFilePath) {
      return NextResponse.json(
        { success: false, error: { message: 'Invoice PDF has not been generated for this order.' } },
        { status: 400 }
      );
    }

    const filepath = path.join(process.cwd(), 'public', order.pdfFilePath);

    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invoice file not found on disk.' } },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filepath);

    const response = new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${order.id}.pdf"`,
      },
    });

    return response;
  } catch (error: any) {
    console.error('Invoice PDF fetch error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}
