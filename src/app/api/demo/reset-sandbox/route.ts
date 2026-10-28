import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Forbidden: Sandbox reset endpoint is permanently disabled in production to protect real salon and customer data.',
    },
    { status: 403 }
  );
}

export async function GET() {
  return POST();
}
