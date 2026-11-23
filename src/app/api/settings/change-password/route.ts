import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';
import { serverError } from '@/lib/http';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const { userId, salonId, salonSlug } = auth.session;
    const clientIp = getClientIp(request);

    // Rate limit: 5 attempts per 15 minutes per user + IP
    const rateLimitKey = `owner_password_change:${userId}:${clientIp}`;
    const rlCheck = await checkRateLimit(rateLimitKey, 5, 900);
    if (rlCheck.isLocked) {
      return NextResponse.json(
        {
          error:
            rlCheck.errorMessage ||
            'Too many incorrect password attempts. Security lock active. Please try again in 15 minutes.',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword, confirmPassword } = body;

    const cleanCurr = currentPassword !== undefined && currentPassword !== null ? String(currentPassword).trim() : '';
    const cleanNew = newPassword !== undefined && newPassword !== null ? String(newPassword).trim() : '';
    const cleanConf = confirmPassword !== undefined && confirmPassword !== null ? String(confirmPassword).trim() : '';

    if (!cleanCurr) {
      return NextResponse.json({ error: 'Please enter your current or temporary password.' }, { status: 400 });
    }
    if (!cleanNew || cleanNew.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }
    if (cleanNew.length > 128) {
      return NextResponse.json({ error: 'New password is too long (maximum 128 characters).' }, { status: 400 });
    }
    if (cleanNew === cleanCurr) {
      return NextResponse.json({ error: 'New password must be different from your current password.' }, { status: 400 });
    }
    if (cleanNew !== cleanConf) {
      return NextResponse.json({ error: 'New password and confirm password do not match.' }, { status: 400 });
    }

    // Static Demo Salon bypass
    if (salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully in demo mode!',
      });
    }

    // Fetch user password_hash
    const userRes = await query(
      `SELECT id, password_hash, email FROM users WHERE id = $1 AND salon_id = $2 LIMIT 1`,
      [userId, salonId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(cleanCurr, user.password_hash);
    if (!passwordMatch) {
      const fail = await recordFailedAttempt(rateLimitKey, 5, 900);
      return NextResponse.json(
        {
          error: fail.isLocked
            ? fail.errorMessage
            : 'Current password is incorrect. Please verify the temporary password provided.',
        },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt
    const newHash = await bcrypt.hash(cleanNew, 10);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2 AND salon_id = $3`, [
      newHash,
      userId,
      salonId,
    ]);

    await resetRateLimit(rateLimitKey);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! Please use your new password next time you sign in.',
    });
  } catch (error) {
    return serverError(error, 'Failed to update password');
  }
}
