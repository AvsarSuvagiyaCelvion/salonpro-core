import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query('SELECT 1');
    return NextResponse.json(
      {
        status: 'ok',
        time: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Health check DB probe failed:', err);
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
      },
      { status: 503 }
    );
  }
}
