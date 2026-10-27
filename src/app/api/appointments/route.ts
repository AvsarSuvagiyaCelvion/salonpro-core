import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function GET(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let sql = `
      SELECT a.id, a.salon_id, a.starts_at, a.ends_at, a.status, a.source, a.note, a.created_at,
             c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
             s.id as staff_id, s.name as staff_name, s.role_title as staff_role,
             sv.id as service_id, sv.name as service_name, sv.category as service_category,
             sv.duration_min, sv.price as service_price
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.salon_id = $1
    `;
    const params: any[] = [salonId];
    let idx = 2;

    if (startDate) {
      sql += ` AND a.starts_at >= $${idx++}::timestamptz `;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.starts_at <= $${idx++}::timestamptz `;
      params.push(endDate);
    }
    if (status !== 'all') {
      sql += ` AND a.status = $${idx++} `;
      params.push(status);
    }

    sql += ` ORDER BY a.starts_at ASC `;

    const res = await query(sql, params);
    return NextResponse.json({ appointments: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const body = await request.json();
    const {
      customer_id,
      new_customer_name,
      new_customer_mobile,
      staff_id,
      service_id,
      date, // 'YYYY-MM-DD'
      start_time, // 'HH:mm'
      note,
    } = body;

    // Validate inputs
    if (!staff_id || !service_id || !date || !start_time) {
      return NextResponse.json(
        { error: 'Staff, service, date, and start time are required' },
        { status: 400 }
      );
    }

    // 1. Resolve or create customer
    let targetCustomerId = customer_id;
    if (!targetCustomerId) {
      if (!new_customer_name || !new_customer_mobile) {
        return NextResponse.json(
          { error: 'Customer selection or customer name and mobile are required' },
          { status: 400 }
        );
      }

      const existingCust = await query(
        'SELECT id FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1',
        [salonId, new_customer_mobile.trim()]
      );

      if (existingCust.rows.length > 0) {
        targetCustomerId = existingCust.rows[0].id;
      } else {
        const createCustRes = await query(
          'INSERT INTO customers (salon_id, name, mobile) VALUES ($1, $2, $3) RETURNING id',
          [salonId, new_customer_name.trim(), new_customer_mobile.trim()]
        );
        targetCustomerId = createCustRes.rows[0].id;
      }
    }

    // 2. Fetch service duration to calculate ends_at
    const srvRes = await query(
      'SELECT id, name, duration_min, price FROM services WHERE id = $1',
      [service_id]
    );
    if (srvRes.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    const durationMin = srvRes.rows[0].duration_min || 30;

    // Construct timestamps
    const startsAt = new Date(`${date}T${start_time}:00`);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60000);

    // 3. Attempt insert into appointments table
    try {
      const apptRes = await query(
        `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note)
         VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'owner', $7)
         RETURNING *`,
        [salonId, targetCustomerId, staff_id, service_id, startsAt.toISOString(), endsAt.toISOString(), note || null]
      );

      return NextResponse.json({
        appointment: apptRes.rows[0],
        message: 'Appointment booked successfully!',
      }, { status: 201 });
    } catch (insertError: any) {
      // Check for PostgreSQL exclusion constraint 'no_overlap'
      if (
        insertError.message.includes('no_overlap') ||
        insertError.message.includes('exclusion constraint')
      ) {
        // Fetch conflicting appointment to display friendly message
        const conflictRes = await query(
          `SELECT a.starts_at, a.ends_at, s.name as staff_name
           FROM appointments a
           JOIN staff s ON a.staff_id = s.id
           WHERE a.staff_id = $1 
             AND a.status IN ('scheduled', 'arrived')
             AND tstzrange(a.starts_at, a.ends_at) && tstzrange($2::timestamptz, $3::timestamptz)
           LIMIT 1`,
          [staff_id, startsAt.toISOString(), endsAt.toISOString()]
        );

        const staffName = conflictRes.rows[0]?.staff_name || 'This stylist';
        const conflictStart = conflictRes.rows[0]
          ? new Date(conflictRes.rows[0].starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : start_time;
        const conflictEnd = conflictRes.rows[0]
          ? new Date(conflictRes.rows[0].ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        return NextResponse.json(
          {
            error: `${staffName} already has an appointment from ${conflictStart} to ${conflictEnd}. Please pick another time or another staff member.`,
            isOverlap: true,
          },
          { status: 409 }
        );
      }

      throw insertError;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
