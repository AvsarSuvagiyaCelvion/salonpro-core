import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { normalizeMobile } from '@/lib/phone';
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
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
      `SELECT id, name, mobile, email, address, avatar_url, salon_id FROM customers WHERE id = $1 LIMIT 1`,
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
    return NextResponse.json({ loggedIn: false, error: 'Failed to verify customer session' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipRateLimitKey = `customer_auth_ip:${clientIp}`;

    // IP rate limit: 20 attempts per 15 minutes (900 seconds)
    const ipCheck = await checkRateLimit(ipRateLimitKey, 20, 900);
    if (ipCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many requests from this IP address. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, name, mobile, email, pin, confirmPin, salonId: reqSalonId, salonSlug } = body;

    // Resolve salonId from reqSalonId or salonSlug. Must resolve to a REAL salon!
    let salonId: string | null = reqSalonId || null;
    if (!salonId && salonSlug) {
      const sRes = await query('SELECT id FROM salons WHERE slug = $1 LIMIT 1', [salonSlug.toLowerCase().trim()]);
      if (sRes.rows.length > 0) salonId = sRes.rows[0].id;
    }

    if (salonId) {
      // Verify salon exists
      const verifySalon = await query('SELECT id FROM salons WHERE id = $1 LIMIT 1', [salonId]);
      if (verifySalon.rows.length === 0) {
        salonId = null;
      }
    }

    if (!salonId) {
      return NextResponse.json(
        { error: 'A valid salon must be specified for customer registration or login.' },
        { status: 400 }
      );
    }

    // Normalise mobile using shared helper
    const cleanMobile = normalizeMobile(mobile);
    if (!cleanMobile) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const cleanPin = pin ? String(pin).trim() : '';
    if (!cleanPin || cleanPin.length < 4) {
      return NextResponse.json(
        { error: 'Please enter a valid 4-digit PIN / password.' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      if (confirmPin !== undefined && cleanPin !== String(confirmPin).trim()) {
        return NextResponse.json({ error: 'PIN and Confirm PIN do not match.' }, { status: 400 });
      }

      const cleanName = name ? String(name).trim() : '';
      if (!cleanName) {
        return NextResponse.json({ error: 'Full name is required to sign up.' }, { status: 400 });
      }

      // Check if customer already exists for THIS (salon_id, mobile)
      const existing = await query(
        `SELECT id, name, mobile, email, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
        [salonId, cleanMobile]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json(
          {
            error: 'An account with this mobile number already exists at this salon. Please sign in with your PIN.',
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
         RETURNING id, name, mobile, email, salon_id`,
        [salonId, cleanName, cleanMobile, email ? String(email).trim() : null, hashedPin]
      );
      const customer = created.rows[0];

      // Reset IP rate limit on successful signup
      await resetRateLimit(ipRateLimitKey);

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
      // Rate limiting per (salon, mobile)
      const rateLimitKey = `customer:${salonId}:${cleanMobile}`;
      const rlCheck = await checkRateLimit(rateLimitKey, 5, 900);
      if (rlCheck.isLocked) {
        return NextResponse.json(
          { error: rlCheck.errorMessage || 'Too many failed login attempts. Your account is temporarily locked for 15 minutes.' },
          { status: 429 }
        );
      }

      // Find customer strictly in target salon
      const custRes = await query(
        `SELECT id, salon_id, name, mobile, email, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
        [salonId, cleanMobile]
      );

      if (custRes.rows.length === 0) {
        await recordFailedAttempt(ipRateLimitKey, 20, 900);
        return NextResponse.json(
          { error: 'No customer account found with this mobile at this salon. Please sign up or book an appointment.' },
          { status: 404 }
        );
      }

      const customer = custRes.rows[0];

      // A customer without a PIN must NOT be able to log in with an arbitrary PIN
      if (!customer.pin) {
        await recordFailedAttempt(ipRateLimitKey, 20, 900);
        return NextResponse.json(
          {
            code: 'PIN_NOT_SET',
            error: 'Please set your PIN using the OTP/verification flow or book an appointment to create it',
            message: 'Please set your PIN using the OTP/verification flow or book an appointment to create it',
          },
          { status: 403 }
        );
      }

      // Verify PIN
      let isPinValid = false;
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

      if (!isPinValid) {
        await recordFailedAttempt(ipRateLimitKey, 20, 900);
        const failResult = await recordFailedAttempt(rateLimitKey, 5, 900);
        if (failResult.isLocked) {
          return NextResponse.json(
            { error: failResult.errorMessage || 'Too many failed login attempts. Account locked for 15 minutes.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          {
            error: `Invalid PIN. ${failResult.remainingAttempts} attempt(s) remaining before account lockout.`,
            remainingAttempts: failResult.remainingAttempts,
          },
          { status: 401 }
        );
      }

      // Successful login - reset both rate limit keys
      await resetRateLimit(rateLimitKey);
      await resetRateLimit(ipRateLimitKey);

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
          salon_id: customer.salon_id,
        },
        message: 'Signed in successfully!',
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
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'login' or 'signup'." }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Customer auth error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
