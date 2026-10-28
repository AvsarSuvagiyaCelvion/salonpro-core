import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        id, 
        name, 
        slug, 
        description, 
        price, 
        billing_interval, 
        features, 
        max_staff, 
        is_popular, 
        sort_order
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY sort_order ASC, price ASC
    `);

    return NextResponse.json({
      success: true,
      plans: res.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

