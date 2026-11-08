import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      redirectUrl: '/admin/salons',
      message: 'Exited impersonation mode successfully.',
    });

    // Clear tenant session cookie
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // Clear impersonation indicator cookie
    response.cookies.set('salonpro_impersonation', '', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/exit-impersonation/route.ts');
  }
}

