import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSessionToken,
} from '@/lib/auth';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
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
    const clientIp = getClientIp(request);

    // Strict rate limit against brute-forcing: 5 attempts per 15 minutes per customer + IP
    const rateLimitKey = `customer_pin_change:${customerId}:${clientIp}`;
    const rlCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (rlCheck.isLocked) {
      return NextResponse.json(
        {
          error:
            rlCheck.errorMessage ||
            'Too many incorrect PIN attempts. Security lock active. Please try again in 15 minutes.',
        },
        { status: 429 }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    if (rawBody === null || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Request body must be a valid JSON object.' }, { status: 400 });
    }
    const { currentPin, newPin, confirmPin } = rawBody;

    const cleanCurrentPin = currentPin !== undefined && currentPin !== null ? String(currentPin).trim() : '';
    const cleanNewPin = newPin !== undefined && newPin !== null ? String(newPin).trim() : '';
    const cleanConfirmPin = confirmPin !== undefined && confirmPin !== null ? String(confirmPin).trim() : '';

    if (!cleanCurrentPin) {
      return NextResponse.json({ error: 'Please enter your current security PIN.' }, { status: 400 });
    }

    if (!cleanNewPin) {
      return NextResponse.json({ error: 'Please enter your new 4-digit security PIN.' }, { status: 400 });
    }

    // New PIN must be exactly 4 digits
    if (!/^\d{4}$/.test(cleanNewPin)) {
      return NextResponse.json(
        { error: 'New PIN must be exactly 4 digits (numbers 0-9 only).' },
        { status: 400 }
      );
    }

    // Must differ from current PIN
    if (cleanNewPin === cleanCurrentPin) {
      return NextResponse.json(
        { error: 'New PIN must be different from your current PIN.' },
        { status: 400 }
      );
    }

    // Confirm PIN check (if confirmPin provided)
    if (cleanConfirmPin && cleanNewPin !== cleanConfirmPin) {
      return NextResponse.json(
        { error: 'New PIN and Confirm PIN do not match.' },
        { status: 400 }
      );
    }

    // Retrieve existing customer record
    const custRes = await query(
      `SELECT id, pin FROM customers WHERE id = $1::uuid LIMIT 1`,
      [customerId]
    );

    if (custRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer account not found.' }, { status: 404 });
    }

    const customer = custRes.rows[0];

    // Verify current PIN with bcrypt
    let isCurrentValid = false;
    if (customer.pin && (customer.pin.startsWith('$2a$') || customer.pin.startsWith('$2b$'))) {
      isCurrentValid = await bcrypt.compare(cleanCurrentPin, customer.pin);
    } else if (customer.pin) {
      // Legacy plain text check
      isCurrentValid = (customer.pin === cleanCurrentPin);
    }

    if (!isCurrentValid) {
      const fail = await recordFailedAttempt(rateLimitKey, 5, 900);
      const remaining = Math.max(0, fail.remainingAttempts);
      const msg = remaining > 0
        ? `Current PIN is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Account security locked for 15 minutes.';

      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Hash new PIN securely
    const hashedPin = await bcrypt.hash(cleanNewPin, 12);

    await query(
      `UPDATE customers
       SET pin = $1::text
       WHERE id = $2::uuid`,
      [hashedPin, customerId]
    );

    // Reset rate limit on successful PIN change
    await resetRateLimit(rateLimitKey);

    return NextResponse.json({
      success: true,
      message: 'Your 4-digit security PIN has been updated successfully.',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/customer/profile/pin/route.ts');
  }
}
