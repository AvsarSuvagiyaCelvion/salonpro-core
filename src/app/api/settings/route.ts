import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const res = await query(
      `SELECT id, name, slug, address, phone, brand_color, logo_url,
              booking_enabled, open_time, close_time, slot_minutes, buffer_minutes,
              working_days, min_advance_hours, max_advance_days, send_reminders
       FROM salons
       WHERE id = $1
       LIMIT 1`,
      [salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json({
      salon: res.rows[0],
      user: {
        email: auth.session.email,
        role: auth.session.role || 'owner',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();

    const {
      name,
      address,
      phone,
      brand_color,
      logo_url,
      booking_enabled,
      open_time,
      close_time,
      slot_minutes,
      buffer_minutes,
      working_days,
      min_advance_hours,
      max_advance_days,
      send_reminders,
    } = body;

    const res = await query(
      `UPDATE salons
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           brand_color = COALESCE($4, brand_color),
           logo_url = $5,
           booking_enabled = COALESCE($6, booking_enabled),
           open_time = COALESCE($7, open_time),
           close_time = COALESCE($8, close_time),
           slot_minutes = COALESCE($9, slot_minutes),
           buffer_minutes = COALESCE($10, buffer_minutes),
           working_days = COALESCE($11, working_days),
           min_advance_hours = COALESCE($12, min_advance_hours),
           max_advance_days = COALESCE($13, max_advance_days),
           send_reminders = COALESCE($14, send_reminders)
       WHERE id = $15
       RETURNING *`,
      [
        name,
        address,
        phone,
        brand_color,
        logo_url,
        booking_enabled,
        open_time,
        close_time,
        slot_minutes,
        buffer_minutes,
        working_days,
        min_advance_hours,
        max_advance_days,
        send_reminders,
        salonId,
      ]
    );

    return NextResponse.json({
      success: true,
      salon: res.rows[0],
      message: 'Salon settings saved successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
