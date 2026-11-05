import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function GET(request: Request) {
  return handleDemoLogin(request);
}

export async function POST(request: Request) {
  return handleDemoLogin(request);
}

async function handleDemoLogin(request: Request) {
  try {
    // 1. Locate the official demo salon (dixa-beauty-salon) or fallback to first active salon
    let salonRes = await query(
      `SELECT u.id as user_id, u.email, u.role, u.full_name,
              s.id as salon_id, s.name as salon_name, s.slug as salon_slug
       FROM salons s
       JOIN users u ON u.salon_id = s.id
       WHERE LOWER(s.slug) = 'dixa-beauty-salon' AND u.role = 'owner'
       LIMIT 1`
    );

    if (salonRes.rows.length === 0) {
      // Fallback: any active salon with an owner
      salonRes = await query(
        `SELECT u.id as user_id, u.email, u.role, u.full_name,
                s.id as salon_id, s.name as salon_name, s.slug as salon_slug
         FROM salons s
         JOIN users u ON u.salon_id = s.id
         WHERE s.is_active = true AND u.role = 'owner'
         LIMIT 1`
      );
    }

    if (salonRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'No demo salon workspace available at this moment.' },
        { status: 404 }
      );
    }

    const demoData = salonRes.rows[0];

    // 2. Generate a valid session token for this demo owner
    const sessionToken = await createSessionToken({
      email: demoData.email,
      role: demoData.role || 'owner',
      salonId: demoData.salon_id,
      userId: demoData.user_id,
      salonSlug: demoData.salon_slug,
    });

    // 3. Construct response (redirect to /app or return JSON)
    const searchParams = new URL(request.url).searchParams;
    const isJson = searchParams.get('format') === 'json' || request.headers.get('accept')?.includes('application/json');

    const url = new URL('/app', request.url);
    url.searchParams.set('demo', 'true');

    const response = isJson
      ? NextResponse.json({ success: true, redirectUrl: url.toString() })
      : NextResponse.redirect(url);

    // 4. Set the session cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Demo owner login error:', error);
    return NextResponse.json(
      { error: 'Failed to launch demo salon dashboard.' },
      { status: 500 }
    );
  }
}
