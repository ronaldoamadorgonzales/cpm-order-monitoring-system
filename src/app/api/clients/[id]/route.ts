import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { serializeBigInt } from '@/lib/serialize';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'Not authorized.' } },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const clientId = BigInt(id);

    // Verify existing client
    const existingClient = await db.query.clients.findFirst({
      where: eq(schema.clients.id, clientId),
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: { message: 'Client not found.' } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { clientType, firstName, lastName, organizationName, officeName, email, phone, location } = body;

    // Check parameters
    if (!clientType || !email || !phone) {
      return NextResponse.json(
        { success: false, error: { message: 'Client type, email, and phone are required.' } },
        { status: 400 }
      );
    }

    if (clientType !== 'INDIVIDUAL' && clientType !== 'ORGANIZATION') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid client type. Must be INDIVIDUAL or ORGANIZATION.' } },
        { status: 400 }
      );
    }

    // Validation rules
    if (clientType === 'INDIVIDUAL') {
      if (!firstName || !lastName) {
        return NextResponse.json(
          { success: false, error: { message: 'First name and last name are required for individual clients.' } },
          { status: 400 }
        );
      }
    } else {
      if (!organizationName) {
        return NextResponse.json(
          { success: false, error: { message: 'Organization name is required for organization clients.' } },
          { status: 400 }
        );
      }
      if (!firstName || !lastName) {
        return NextResponse.json(
          { success: false, error: { message: 'Primary contact person\'s first name and last name are required for organization clients.' } },
          { status: 400 }
        );
      }
      if (!location) {
        return NextResponse.json(
          { success: false, error: { message: 'Organization location is required.' } },
          { status: 400 }
        );
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email address format.' } },
        { status: 400 }
      );
    }

    // Resolve Office Name
    let resolvedOfficeId: bigint | null = null;
    if (clientType === 'ORGANIZATION' && officeName && officeName.trim() !== '') {
      const trimmedOfficeName = officeName.trim();
      const existingOffice = await db.query.offices.findFirst({
        where: eq(schema.offices.officeName, trimmedOfficeName)
      });
      if (existingOffice) {
        resolvedOfficeId = existingOffice.id;
      } else {
        const insertedOffice = await db.insert(schema.offices).values({
          officeName: trimmedOfficeName
        }).returning();
        resolvedOfficeId = insertedOffice[0].id;
      }
    }

    const updatedClients = await db.update(schema.clients)
      .set({
        clientType,
        firstName: firstName || null,
        lastName: lastName || null,
        organizationName: organizationName || null,
        officeId: resolvedOfficeId,
        email,
        phone,
        location: location || null,
      })
      .where(eq(schema.clients.id, clientId))
      .returning();

    return NextResponse.json({
      success: true,
      data: serializeBigInt(updatedClients[0]),
    });
  } catch (error: any) {
    console.error('Client update error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}
