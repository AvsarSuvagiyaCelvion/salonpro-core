import { NextResponse } from 'next/server';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';
import {
  DEMO_SALON_ID,
  DEMO_USER_ID,
  DEMO_SALON_SLUG,
  DEMO_OWNER_EMAIL,
} from '@/lib/demo-data';

export async function GET(request: Request) {
  return handleDemoLogin(request);
}

export async function POST(request: Request) {
  return handleDemoLogin(request);
}

async function handleDemoLogin(request: Request) {
  try {
    // Generate a valid signed session token for static demo owner without DB dependence
    const sessionToken = await createSessionToken({
      email: DEMO_OWNER_EMAIL,
      role: 'owner',
      salonId: DEMO_SALON_ID,
      userId: DEMO_USER_ID,
      salonSlug: DEMO_SALON_SLUG,
    });

    const searchParams = new URL(request.url).searchParams;
    const isJson =
      searchParams.get('format') === 'json' ||
      request.headers.get('accept')?.includes('application/json');

    const url = new URL('/app', request.url);
    url.searchParams.set('demo', 'true');

    const response = isJson
      ? NextResponse.json({
          success: true,
          message: 'Logged in to Dixa Beauty Salon demo workspace',
          user: {
            email: DEMO_OWNER_EMAIL,
            role: 'owner',
            salonId: DEMO_SALON_ID,
            salonSlug: DEMO_SALON_SLUG,
          },
          redirectTo: '/app?demo=true',
        })
      : NextResponse.redirect(url);

    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to initialize demo login session' },
      { status: 500 }
    );
  }
}
