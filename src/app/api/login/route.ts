import { NextResponse } from 'next/server';
import { createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = (process.env.DEMO_EMAIL || 'avsarsuvagiya968@gmail.com').trim().toLowerCase();
    const expectedPassword = process.env.DEMO_PASSWORD || 'Av$@r2136';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (
      email.trim().toLowerCase() !== expectedEmail ||
      password !== expectedPassword
    ) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSessionToken({
      email: expectedEmail,
      role: 'owner',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    // Set signed httpOnly cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
