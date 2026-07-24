import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import * as schema from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { serializeBigInt } from '@/lib/serialize';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'Not authorized.' } },
      { status: 401 }
    );
  }

  try {
    const items = await db.select().from(schema.items).orderBy(asc(schema.items.itemName));
    return NextResponse.json({
      success: true,
      data: serializeBigInt(items),
    });
  } catch (error: any) {
    console.error('Items GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const role = req.headers.get('x-role');
  if (!userId || !role) {
    return NextResponse.json(
      { success: false, error: { message: 'Not authorized.' } },
      { status: 401 }
    );
  }

  if (role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: { message: 'Only administrators can add catalog items.' } },
      { status: 403 }
    );
  }

  try {
    const { itemName, category } = await req.json();
    if (!itemName || !category) {
      return NextResponse.json(
        { success: false, error: { message: 'Item name and category are required.' } },
        { status: 400 }
      );
    }

    const insertedList = await db.insert(schema.items)
      .values({ itemName, category })
      .returning();

    return NextResponse.json({
      success: true,
      data: serializeBigInt(insertedList[0]),
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { message: 'An item with this name already exists.' } },
        { status: 400 }
      );
    }
    console.error('Items POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}
