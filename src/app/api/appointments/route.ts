import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT a.id, a.salon_id, a.starts_at, a.ends_at, a.status, a.source, a.note, a.created_at,
             c.id as customer_id, c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
             s.id as staff_id, s.name as staff_name, s.role_title as staff_role,
             sv.id as service_id, sv.name as service_name, sv.category as service_category,
             sv.duration_min, sv.price as service_price,
             COUNT(*) OVER() as full_count
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
    sql += ` LIMIT $${idx++} OFFSET $${idx++} `;
    params.push(pageSize, offset);

    const res = await query(sql, params);

    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    const appointments = res.rows.map((row) => {
      const { full_count, ...cleanRow } = row;
      return cleanRow;
    });

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/appointments/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
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

    // 1. Resolve or create customer within caller's salon
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
    } else {
      // Ensure target customer belongs to caller's salon
      const verifyCust = await query(
        'SELECT id FROM customers WHERE id = $1 AND salon_id = $2 LIMIT 1',
        [targetCustomerId, salonId]
      );
      if (verifyCust.rows.length === 0) {
        return NextResponse.json({ error: 'Customer not found in this salon' }, { status: 404 });
      }
    }

    // 2. Fetch service duration to calculate ends_at (scoped to salon)
    const srvRes = await query(
      'SELECT id, name, duration_min, price FROM services WHERE id = $1 AND salon_id = $2',
      [service_id, salonId]
    );
    if (srvRes.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found in this salon' }, { status: 404 });
    }
    const durationMin = srvRes.rows[0].duration_min || 30;

    // Verify staff belongs to caller's salon
    const staffRes = await query(
      'SELECT id, name FROM staff WHERE id = $1 AND salon_id = $2',
      [staff_id, salonId]
    );
    if (staffRes.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found in this salon' }, { status: 404 });
    }

    // Construct timestamps in Indian Standard Time (IST, UTC+05:30) so time doesn't shift by 5.5 hours on UTC servers
    const cleanStartTime = start_time.trim().length === 5 ? `${start_time.trim()}:00` : start_time.trim();
    const startsAt = new Date(`${date.trim()}T${cleanStartTime}+05:30`);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60000);

    // 3. Attempt insert into appointments table with current timestamp
    try {
      const apptRes = await query(
        `INSERT INTO appointments (salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', 'owner', $7, NOW())
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
          ? new Date(conflictRes.rows[0].starts_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
          : start_time;
        const conflictEnd = conflictRes.rows[0]
          ? new Date(conflictRes.rows[0].ends_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
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
    return serverError(error, 'src/app/api/appointments/route.ts');
  }
}
