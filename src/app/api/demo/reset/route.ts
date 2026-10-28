import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Forbidden: Global database reset endpoint is permanently disabled for multi-tenant security.',
    },
    { status: 403 }
  );
}

export async function GET() {
  return POST();
}
