import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { BUCKET_NAME, getSupabaseUrl } from '@/lib/storage';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const session = await verifyCustomerSessionToken(token);
    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired customer session.' }, { status: 401 });
    }

    const customerId = session.customerId;
    const custRes = await query(
      `SELECT id, salon_id, name, mobile, email, address, avatar_url, created_at
       FROM customers
       WHERE id = $1::uuid
       LIMIT 1`,
      [customerId]
    );

    if (custRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ customer: custRes.rows[0] });
  } catch (error: any) {
    return serverError(error, 'src/app/api/customer/profile/route.ts (GET)');
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const session = await verifyCustomerSessionToken(token);
    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired customer session.' }, { status: 401 });
    }

    const customerId = session.customerId;

    // Rate-limit: 20 profile updates per 15 minutes per customer
    const rateLimitKey = `cust_profile_patch:${customerId}`;
    const rl = await checkRateLimit(rateLimitKey, 20, 900);
    if (rl.isLocked) {
      return NextResponse.json(
        { error: 'Too many profile update requests. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    if (rawBody === null || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Request body must be a valid JSON object.' }, { status: 400 });
    }
    const { name, email, address, avatar_url } = rawBody;

    // 1. Validate Name (if provided: 2-60 chars)
    const hasName = name !== undefined;
    let finalName: string | null = null;
    if (hasName) {
      if (typeof name !== 'string') {
        return NextResponse.json({ error: 'Full name must be a valid text string.' }, { status: 400 });
      }
      finalName = name.trim();
      if (finalName.length < 2 || finalName.length > 60) {
        return NextResponse.json(
          { error: 'Full name must be between 2 and 60 characters in length.' },
          { status: 400 }
        );
      }
    }

    // 2. Validate Email (if provided: valid format, max 120 chars)
    const hasEmail = email !== undefined;
    let finalEmail: string | null = null;
    if (hasEmail) {
      if (email !== null && String(email).trim() !== '') {
        finalEmail = String(email).trim().toLowerCase();
        if (finalEmail.length > 120) {
          return NextResponse.json({ error: 'Email address cannot exceed 120 characters.' }, { status: 400 });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(finalEmail)) {
          return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
        }
      } else {
        finalEmail = null;
      }
    }

    // 3. Validate Address (if provided: max 250 chars)
    const hasAddress = address !== undefined;
    let finalAddress: string | null = null;
    if (hasAddress) {
      if (address !== null && String(address).trim() !== '') {
        finalAddress = String(address).trim();
        if (finalAddress.length > 250) {
          return NextResponse.json({ error: 'Address cannot exceed 250 characters.' }, { status: 400 });
        }
      } else {
        finalAddress = null;
      }
    }

    // 4. Validate avatar_url (if provided: must point strictly to customer's own storage folder)
    const hasAvatar = avatar_url !== undefined;
    let finalAvatar: string | null = null;
    if (hasAvatar) {
      if (avatar_url !== null && String(avatar_url).trim() !== '') {
        finalAvatar = String(avatar_url).trim();

        // Reject data: URIs
        if (finalAvatar.startsWith('data:')) {
          return NextResponse.json(
            { error: 'Data URIs are not accepted. Avatar must be uploaded through the storage API.' },
            { status: 400 }
          );
        }

        // Accept ONLY public URL inside this customer's own folder
        const supabaseUrl = getSupabaseUrl();
        const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/customers/${customerId}/`;
        if (!finalAvatar.startsWith(expectedPrefix)) {
          return NextResponse.json(
            { error: 'Avatar URL must point strictly inside your customer storage folder.' },
            { status: 400 }
          );
        }
      } else {
        finalAvatar = null;
      }
    }

    // Perform database update with cast parameters
    const updateRes = await query(
      `UPDATE customers
       SET name = CASE WHEN $1::boolean THEN $2::text ELSE name END,
           email = CASE WHEN $3::boolean THEN $4::text ELSE email END,
           address = CASE WHEN $5::boolean THEN $6::text ELSE address END,
           avatar_url = CASE WHEN $7::boolean THEN $8::text ELSE avatar_url END
       WHERE id = $9::uuid
       RETURNING id, salon_id, name, mobile, email, address, avatar_url, created_at`,
      [
        hasName,
        finalName,
        hasEmail,
        finalEmail,
        hasAddress,
        finalAddress,
        hasAvatar,
        finalAvatar,
        customerId,
      ]
    );

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const updatedCustomer = updateRes.rows[0];

    // If name changed, update the customer session cookie so portal header stays synced
    const response = NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Profile updated successfully.',
    });

    if (hasName && finalName) {
      const newToken = await createCustomerSessionToken({
        customerId: updatedCustomer.id,
        mobile: updatedCustomer.mobile,
        name: updatedCustomer.name,
        salonId: updatedCustomer.salon_id,
      });

      response.cookies.set({
        name: CUSTOMER_COOKIE_NAME,
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    return serverError(error, 'src/app/api/customer/profile/route.ts (PATCH)');
  }
}

