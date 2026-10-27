import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ loggedIn: false });
    }

    const payload = await verifyAdminSessionToken(token);
    if (!payload) {
      return NextResponse.json({ loggedIn: false });
    }

    return NextResponse.json({
      loggedIn: true,
      admin: {
        email: payload.email,
        role: 'super_admin',
        name: 'Master Platform Admin',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ loggedIn: false, error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    // Accepted Super Admin credentials
    const validAdmins = [
      { email: 'admin@salonpro.com', pass: 'Admin@2136' },
      { email: 'avsarsuvagiya968@gmail.com', pass: 'Av$@r2136' },
    ];

    const match = validAdmins.find(
      (a) => a.email === cleanEmail && a.pass === cleanPassword
    );

    if (!match) {
      return NextResponse.json(
        { error: 'Invalid Super Admin credentials. Please check your email and password.' },
        { status: 401 }
      );
    }

    const token = await createAdminSessionToken({
      email: match.email,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Master Admin authenticated successfully',
      admin: {
        email: match.email,
        role: 'super_admin',
        name: 'Master Platform Admin',
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
