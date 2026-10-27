import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function POST(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const { customer_id, name, mobile } = await request.json();

    let targetCustomerId = customer_id;

    // If new customer details provided
    if (!targetCustomerId) {
      if (!name || !mobile) {
        return NextResponse.json(
          { error: 'Name and mobile are required to register a customer' },
          { status: 400 }
        );
      }

      // Check if customer with mobile exists
      const existing = await query(
        'SELECT id FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1',
        [salonId, mobile.trim()]
      );

      if (existing.rows.length > 0) {
        targetCustomerId = existing.rows[0].id;
      } else {
        const newCust = await query(
          'INSERT INTO customers (salon_id, name, mobile) VALUES ($1, $2, $3) RETURNING id',
          [salonId, name.trim(), mobile.trim()]
        );
        targetCustomerId = newCust.rows[0].id;
      }
    }

    // Insert into waiting table
    const waitRes = await query(
      `INSERT INTO waiting (salon_id, customer_id)
       VALUES ($1, $2)
       RETURNING *`,
      [salonId, targetCustomerId]
    );

    return NextResponse.json({
      waiting: waitRes.rows[0],
      message: 'Customer added to waiting queue',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
