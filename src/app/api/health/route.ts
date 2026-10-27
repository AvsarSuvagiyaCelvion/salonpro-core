import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT NOW() as db_time');
    return NextResponse.json({
      status: 'ok',
      db_time: result.rows[0].db_time,
      message: 'Supabase PostgreSQL connected successfully!',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Database connection error',
        hint: 'Please check your DATABASE_URL in .env.local and make sure [YOUR-PASSWORD] is replaced with your real database password.',
      },
      { status: 500 }
    );
  }
}
