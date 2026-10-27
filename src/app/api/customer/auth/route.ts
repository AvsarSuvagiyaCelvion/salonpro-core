import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const payload = await verifyCustomerSessionToken(token);
    if (!payload) {
      return NextResponse.json({ loggedIn: false });
    }

    const custRes = await query(
      `SELECT id, name, mobile, email FROM customers WHERE id = $1 LIMIT 1`,
      [payload.customerId]
    );

    if (custRes.rows.length === 0) {
      return NextResponse.json({ loggedIn: false });
    }

    return NextResponse.json({
      loggedIn: true,
      customer: custRes.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ loggedIn: false, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const body = await request.json();
    const { action, name, mobile, email, pin } = body;

    const cleanMobile = mobile?.trim().replace(/\D/g, '');
    const cleanPin = pin?.trim() || '1234';

    if (!cleanMobile || cleanMobile.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit mobile number is required.' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      const cleanName = name?.trim();
      if (!cleanName) {
        return NextResponse.json({ error: 'Full name is required to sign up.' }, { status: 400 });
      }

      // Check if customer already exists
      const existing = await query(
        `SELECT id, name, mobile, email, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
        [salonId, cleanMobile]
      );

      let customer;
      if (existing.rows.length > 0) {
        // Update customer details and pin
        const updated = await query(
          `UPDATE customers 
           SET name = $1, email = COALESCE($2, email), pin = $3
           WHERE id = $4
           RETURNING id, name, mobile, email`,
          [cleanName, email?.trim() || null, cleanPin, existing.rows[0].id]
        );
        customer = updated.rows[0];
      } else {
        // Create new customer
        const created = await query(
          `INSERT INTO customers (salon_id, name, mobile, email, pin)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, mobile, email`,
          [salonId, cleanName, cleanMobile, email?.trim() || null, cleanPin]
        );
        customer = created.rows[0];
      }

      // Create session cookie
      const token = await createCustomerSessionToken({
        customerId: customer.id,
        mobile: customer.mobile,
        name: customer.name,
        salonId,
      });

      const response = NextResponse.json({
        success: true,
        customer,
        message: 'Account created successfully!',
      });

      response.cookies.set({
        name: CUSTOMER_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;
    } else if (action === 'login') {
      // Find customer
      const custRes = await query(
        `SELECT id, name, mobile, email, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
        [salonId, cleanMobile]
      );

      if (custRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'No customer account found with this mobile. Please sign up.' },
          { status: 404 }
        );
      }

      const customer = custRes.rows[0];

      // Validate PIN/Password (default demo PIN 1234 supported)
      if (customer.pin && customer.pin !== cleanPin && cleanPin !== '1234') {
        return NextResponse.json(
          { error: 'Incorrect PIN / password. (Demo PIN: 1234)' },
          { status: 401 }
        );
      }

      // If customer had no PIN, set it
      if (!customer.pin) {
        await query(`UPDATE customers SET pin = $1 WHERE id = $2`, [cleanPin, customer.id]);
      }

      const token = await createCustomerSessionToken({
        customerId: customer.id,
        mobile: customer.mobile,
        name: customer.name,
        salonId,
      });

      const response = NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email,
        },
        message: `Welcome back, ${customer.name}!`,
      });

      response.cookies.set({
        name: CUSTOMER_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    } else {
      return NextResponse.json({ error: 'Valid action (login or signup) required' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
