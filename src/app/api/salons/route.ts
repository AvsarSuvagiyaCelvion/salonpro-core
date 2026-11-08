import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, name, slug, address, phone, brand_color, logo_url, open_time, close_time
       FROM salons
       WHERE is_active = true
       ORDER BY name ASC`
    );

    return NextResponse.json({
      salons: res.rows,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/salons/route.ts');
  }
}

