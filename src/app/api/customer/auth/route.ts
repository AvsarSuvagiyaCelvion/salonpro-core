import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '@/lib/rate-limit';

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
    const body = await request.json();
    const { action, name, mobile, email, pin, confirmPin, salonId: reqSalonId, salonSlug } = body;

    let salonId = reqSalonId;
    if (!salonId && salonSlug) {
      const sRes = await query('SELECT id FROM salons WHERE slug = $1 LIMIT 1', [salonSlug.toLowerCase().trim()]);
      if (sRes.rows.length > 0) salonId = sRes.rows[0].id;
    }
    if (!salonId) {
      salonId = await getDefaultSalonId();
    }

    const cleanMobile = mobile?.trim().replace(/\D/g, '');
    const cleanPin = pin?.trim() || '';

    if (!cleanMobile || cleanMobile.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit mobile number is required.' },
        { status: 400 }
      );
    }

    if (!cleanPin || cleanPin.length < 4) {
      return NextResponse.json(
        { error: 'Please enter a valid 4-digit PIN / password.' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      if (confirmPin !== undefined && cleanPin !== confirmPin?.trim()) {
        return NextResponse.json({ error: 'PIN and Confirm PIN do not match.' }, { status: 400 });
      }

      const cleanName = name?.trim();
      if (!cleanName) {
        return NextResponse.json({ error: 'Full name is required to sign up.' }, { status: 400 });
      }

      // Check if customer already exists - existing account must NOT overwrite PIN!
      const existing = await query(
        `SELECT id, name, mobile, email, pin FROM customers WHERE (salon_id = $1 AND mobile = $2) OR mobile = $2 LIMIT 1`,
        [salonId, cleanMobile]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          {
            error: 'An account with this mobile number already exists. Please sign in with your PIN or request support.',
            code: 'ACCOUNT_EXISTS',
            requiresLogin: true,
          },
          { status: 409 }
        );
      }

      // Hash PIN securely with bcrypt
      const hashedPin = await bcrypt.hash(cleanPin, 10);

      // Create new customer with hashed PIN
      const created = await query(
        `INSERT INTO customers (salon_id, name, mobile, email, pin)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, mobile, email`,
        [salonId, cleanName, cleanMobile, email?.trim() || null, hashedPin]
      );
      const customer = created.rows[0];

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
      // 1. Rate limiting check & lockout protection
      const rateLimitKey = `customer:${cleanMobile}`;
      const rlCheck = await checkRateLimit(rateLimitKey, 5, 900);
      if (rlCheck.isLocked) {
        return NextResponse.json(
          { error: rlCheck.errorMessage || 'Too many failed login attempts. Your account is temporarily locked for 15 minutes.' },
          { status: 429 }
        );
      }

      // 2. Find customer in target salon, or across salons by mobile
      let custRes = await query(
        `SELECT id, salon_id, name, mobile, email, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
        [salonId, cleanMobile]
      );

      if (custRes.rows.length === 0) {
        custRes = await query(
          `SELECT id, salon_id, name, mobile, email, pin FROM customers WHERE mobile = $1 ORDER BY id DESC LIMIT 1`,
          [cleanMobile]
        );
      }

      if (custRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'No customer account found with this mobile. Please sign up.' },
          { status: 404 }
        );
      }

      const customer = custRes.rows[0];
      const actualSalonId = customer.salon_id || salonId;

      // 3. Verify bcrypt-hashed PIN or migrate legacy plain text
      let isPinValid = false;
      if (customer.pin) {
        if (customer.pin.startsWith('$2a$') || customer.pin.startsWith('$2b$')) {
          isPinValid = await bcrypt.compare(cleanPin, customer.pin);
        } else {
          // Legacy plain text check & migration
          isPinValid = (customer.pin === cleanPin);
          if (isPinValid) {
            const newHash = await bcrypt.hash(cleanPin, 10);
            await query(`UPDATE customers SET pin = $1 WHERE id = $2`, [newHash, customer.id]);
          }
        }
      } else {
        // Customer had no PIN set (e.g. booked before PIN requirement), set it on initial login
        const newHash = await bcrypt.hash(cleanPin, 10);
        await query(`UPDATE customers SET pin = $1 WHERE id = $2`, [newHash, customer.id]);
        isPinValid = true;
      }

      if (!isPinValid) {
        const failResult = await recordFailedAttempt(rateLimitKey, 5, 900);
        if (failResult.isLocked) {
          return NextResponse.json(
            { error: failResult.errorMessage || 'Too many failed login attempts. Account is temporarily locked.' },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            error: `Incorrect PIN. ${failResult.remainingAttempts} attempt${failResult.remainingAttempts === 1 ? '' : 's'} remaining before temporary lockout.`,
            remainingAttempts: failResult.remainingAttempts,
          },
          { status: 401 }
        );
      }

      // Successful login -> reset rate limit counter
      await resetRateLimit(rateLimitKey);

      const token = await createCustomerSessionToken({
        customerId: customer.id,
        mobile: customer.mobile,
        name: customer.name,
        salonId: actualSalonId,
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
