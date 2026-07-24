import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import * as schema from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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
    const clientRows = await db
      .select({
        id: schema.clients.id,
        clientType: schema.clients.clientType,
        firstName: schema.clients.firstName,
        lastName: schema.clients.lastName,
        organizationName: schema.clients.organizationName,
        officeId: schema.clients.officeId,
        email: schema.clients.email,
        phone: schema.clients.phone,
        location: schema.clients.location,
        createdAt: schema.clients.createdAt,
        officeName: schema.offices.officeName,
        officeCreatedAt: schema.offices.createdAt,
      })
      .from(schema.clients)
      .leftJoin(schema.offices, eq(schema.clients.officeId, schema.offices.id))
      .orderBy(desc(schema.clients.createdAt));

    const clients = clientRows.map(row => ({
      id: row.id,
      clientType: row.clientType,
      firstName: row.firstName,
      lastName: row.lastName,
      organizationName: row.organizationName,
      officeId: row.officeId,
      email: row.email,
      phone: row.phone,
      location: row.location,
      createdAt: row.createdAt,
      office: row.officeId ? {
        id: row.officeId,
        officeName: row.officeName,
        createdAt: row.officeCreatedAt,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: serializeBigInt(clients),
    });
  } catch (error: any) {
    console.error('Clients fetch error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: 'Not authorized.' } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { clientType, firstName, lastName, organizationName, officeName, email, phone, location } = body;

    // Check basic parameters
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

    // Validation matching requirements
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

    // Standard email/phone validation
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

    const insertedClients = await db.insert(schema.clients).values({
      clientType,
      firstName: firstName || null,
      lastName: lastName || null,
      organizationName: organizationName || null,
      officeId: resolvedOfficeId,
      email,
      phone,
      location: location ||  null,
    }).returning();

    const client = insertedClients[0];

    return NextResponse.json({
      success: true,
      data: serializeBigInt(client),
    });
  } catch (error: any) {
    console.error('Client creation error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'An internal server error occurred.' } },
      { status: 500 }
    );
  }
}
