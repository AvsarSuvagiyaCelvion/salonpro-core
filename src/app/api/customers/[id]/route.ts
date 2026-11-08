import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { normalizeMobile } from '@/lib/phone';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await params;
    const body = await request.json();
    const { name, mobile, email, note, birthday, resetPin } = body;

    // Counter PIN Reset Action: If receptionist/salon counter is resetting customer's 4-digit PIN
    if (resetPin !== undefined) {
      const cleanPin = String(resetPin).trim();
      if (!/^\d{4}$/.test(cleanPin)) {
        return NextResponse.json({ error: 'Security PIN must be exactly 4 numeric digits (e.g. 1234)' }, { status: 400 });
      }

      const bcrypt = await import('bcryptjs');
      const hashedPin = await bcrypt.hash(cleanPin, 10);

      const pinRes = await query(
        `UPDATE customers
         SET pin = $1, updated_at = NOW()
         WHERE id = $2 AND salon_id = $3
         RETURNING id, name, mobile`,
        [hashedPin, id, salonId]
      );

      if (pinRes.rows.length === 0) {
        return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Customer portal PIN reset successfully to ${cleanPin}`,
        newPin: cleanPin,
        customer: pinRes.rows[0],
      });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const cleanMobile = normalizeMobile(mobile);
    if (!cleanMobile) {
      return NextResponse.json({ error: 'Valid 10-digit mobile number is required' }, { status: 400 });
    }

    try {
      const res = await query(
        `UPDATE customers
         SET name = $1, mobile = $2, email = $3, note = $4, birthday = $5
         WHERE id = $6 AND salon_id = $7
         RETURNING *`,
        [name.trim(), cleanMobile, email?.trim() || null, note?.trim() || null, birthday || null, id, salonId]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
      }

      return NextResponse.json({ customer: res.rows[0], message: 'Customer updated successfully' });
    } catch (updateErr: any) {
      if (updateErr.code === '23505') {
        return NextResponse.json(
          { error: 'Another customer in your salon is already using this mobile number' },
          { status: 409 }
        );
      }
      throw updateErr;
    }
  } catch (error: any) {
    return serverError(error, 'src/app/api/customers/[id]/route.ts');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await params;

    // Check if customer exists in this salon
    const checkCust = await query('SELECT id, name FROM customers WHERE id = $1 AND salon_id = $2', [id, salonId]);
    if (checkCust.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
    }

    // Safety Guard: Check if customer has transaction or appointment history
    const historyCheck = await query(`
      SELECT 
        (SELECT count(*) FROM appointments WHERE customer_id = $1) as appts_count,
        (SELECT count(*) FROM invoices WHERE customer_id = $1) as invoices_count,
        (SELECT count(*) FROM sessions WHERE customer_id = $1) as sessions_count
    `, [id]);

    const { appts_count, invoices_count, sessions_count } = historyCheck.rows[0];
    if (parseInt(appts_count) > 0 || parseInt(invoices_count) > 0 || parseInt(sessions_count) > 0) {
      return NextResponse.json({
        error: `Customer "${checkCust.rows[0].name}" has ${invoices_count} invoices and ${appts_count} appointments. All customer records are permanently preserved for commercial accounting integrity and cannot be deleted.`,
      }, { status: 400 });
    }

    const res = await query(
      'DELETE FROM customers WHERE id = $1 AND salon_id = $2 RETURNING id',
      [id, salonId]
    );

    return NextResponse.json({ success: true, message: 'Customer removed' });
  } catch (error: any) {
    return serverError(error, 'src/app/api/customers/[id]/route.ts');
  }
}
