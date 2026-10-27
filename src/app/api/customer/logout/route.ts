import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(CUSTOMER_COOKIE_NAME);
  return response;
}
