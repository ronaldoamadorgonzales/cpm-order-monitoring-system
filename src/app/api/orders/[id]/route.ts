import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import * as schema from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { serializeBigInt } from '@/lib/serialize';

// Helper to validate HH:MM time format
function validateTimeFormat(timeStr: string | null | undefined): boolean {
  if (!timeStr) return true;
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeStr);
}

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
      with: {
        client: {
          with: {
            office: true,
          },
        },
        venue: true,
        serviceType: true,
        status: true,
        orderDays: {
          with: {
            mealPeriods: {
              with: {
                menu: true,
              },
            },
          },
          orderBy: (od, { asc }) => [asc(od.eventDate)],
        },
        history: {
          with: {
            fromStatus: true,
            toStatus: true,
          },
          orderBy: (oh, { desc }) => [desc(oh.createdAt)],
        },
      },
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
        { success: false, error: { message: 'Not authorized to view this order.' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeBigInt(order),
    });
  } catch (error: any) {
    console.error('Order GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const existingOrder = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: { status: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: { message: 'Order not found.' } },
        { status: 404 }
      );
    }

    // RLS check
    if (role !== 'ADMIN' && existingOrder.createdByUserId !== BigInt(userId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authorized to modify this order.' } },
        { status: 403 }
      );
    }

    // Edit Locking validation
    // User can only edit if status is DRAFT or FOR_UPDATE
    if (role !== 'ADMIN') {
      const statusName = existingOrder.status.statusName;
      if (statusName === 'PENDING_APPROVAL' || statusName === 'APPROVED') {
        return NextResponse.json(
          { success: false, error: { message: 'Approved or pending orders cannot be modified.' } },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      clientId,
      venueId,
      customDeliveryAddress,
      serviceTypeId,
      ingressTime,
      egressTime,
      specialInstructions,
      orderDays,
    } = body;

    // Validate times
    if (!validateTimeFormat(ingressTime) || !validateTimeFormat(egressTime)) {
      return NextResponse.json(
        { success: false, error: { message: 'Ingress and egress times must be in HH:MM format.' } },
        { status: 400 }
      );
    }

    if (!customDeliveryAddress || customDeliveryAddress.trim() === '') {
      return NextResponse.json(
        { success: false, error: { message: 'Delivery address is required.' } },
        { status: 400 }
      );
    }

    // Recalculate Grand Total from scratch
    let calculatedGrandTotal = 0;
    const menuCache: Record<string, any> = {};

    for (const day of orderDays) {
      for (const meal of day.mealPeriods) {
        const menuIdStr = meal.menuId.toString();
        let menu = menuCache[menuIdStr];
        if (!menu) {
          const menuList = await db.select().from(schema.menus).where(eq(schema.menus.id, BigInt(meal.menuId))).limit(1);
          menu = menuList[0];
          if (!menu || !menu.isActive) {
            return NextResponse.json(
              { success: false, error: { message: `Menu with id ${meal.menuId} is invalid or inactive.` } },
              { status: 400 }
            );
          }
          menuCache[menuIdStr] = menu;
        }
        calculatedGrandTotal += Number(menu.baseRate) * Number(meal.pax);
      }
    }

    // Update everything in a single transaction
    const updatedOrder = await db.transaction(async (tx) => {
      // 1. Delete old order days and meal periods (cascading deletes will handle child bridge_cpm_meal_periods)
      await tx.delete(schema.orderDays).where(eq(schema.orderDays.orderId, orderId));

      // 2. Update order header
      const updatedHeaderList = await tx.update(schema.orders)
        .set({
          clientId: BigInt(clientId),
          venueId: null,
          customDeliveryAddress: customDeliveryAddress,
          serviceTypeId: BigInt(serviceTypeId),
          ingressTime: ingressTime || null,
          egressTime: egressTime || null,
          grandTotal: calculatedGrandTotal.toFixed(2),
          specialInstructions,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId))
        .returning();
      
      const order = updatedHeaderList[0];

      // 3. Recreate order days & meal periods
      for (const day of orderDays) {
        const insertedDays = await tx.insert(schema.orderDays).values({
          orderId: order.id,
          eventDate: day.eventDate,
        }).returning();
        const orderDay = insertedDays[0];

        for (const meal of day.mealPeriods) {
          const menu = menuCache[meal.menuId.toString()];
          await tx.insert(schema.mealPeriods).values({
            orderDayId: orderDay.id,
            menuId: BigInt(meal.menuId),
            pax: Number(meal.pax),
            rate: menu.baseRate,
          });
        }
      }

      // 4. Log to history
      await tx.insert(schema.orderHistory).values({
        orderId: order.id,
        fromStatusId: existingOrder.statusId,
        toStatusId: existingOrder.statusId, // status unchanged by edit
        changedByUserId: BigInt(userId),
        remarks: 'Order details modified by user.',
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      data: serializeBigInt(updatedOrder),
    });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}
