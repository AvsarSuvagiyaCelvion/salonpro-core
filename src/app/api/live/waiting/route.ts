import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
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

      // Check if customer with mobile exists in caller's salon
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
    } else {
      // Verify existing customer belongs to caller's salon
      const verifyCust = await query(
        'SELECT id FROM customers WHERE id = $1 AND salon_id = $2 LIMIT 1',
        [targetCustomerId, salonId]
      );
      if (verifyCust.rows.length === 0) {
        return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
      }
    }

    // Insert into waiting table with current timestamp
    const waitRes = await query(
      `INSERT INTO waiting (salon_id, customer_id, created_at)
       VALUES ($1, $2, NOW())
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
