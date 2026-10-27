import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createCustomerSessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const {
      service_id,
      staff_id,
      date,
      time,
      name,
      mobile,
      code,
      note,
    } = body;

    // 1. Verify demo 4-digit code
    if (code !== '1234') {
      return NextResponse.json(
        { error: 'Invalid verification code. Please enter demo code 1234.' },
        { status: 400 }
      );
    }

    if (!service_id || !date || !time || !name || !mobile) {
      return NextResponse.json(
        { error: 'All fields (Service, Date, Time, Name, Mobile) are required.' },
        { status: 400 }
      );
    }

    // 2. Fetch salon
    const salonRes = await query(
      `SELECT id, name, slug, phone, brand_color, buffer_minutes 
       FROM salons 
       WHERE slug = $1 LIMIT 1`,
      [slug]
    );

    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const salon = salonRes.rows[0];

    // 3. Fetch service
    const serviceRes = await query(
      `SELECT id, name, duration_min, price 
       FROM services 
       WHERE id = $1 AND salon_id = $2 LIMIT 1`,
      [service_id, salon.id]
    );

    if (serviceRes.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = serviceRes.rows[0];

    // Calculate starts_at & ends_at
    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + service.duration_min * 60000);

    // 4. Resolve Staff member
    let finalStaffId = staff_id;
    if (!finalStaffId || finalStaffId === 'anyone') {
      // Find an active eligible staff member free at this slot
      const candidateStaff = await query(
        `SELECT s.id, s.name 
         FROM staff s
         WHERE s.salon_id = $1 AND s.active = true AND s.show_online = true
           AND (
             NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id)
             OR EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id AND service_id = $2)
           )
           AND NOT EXISTS (
             SELECT 1 FROM appointments a
             WHERE a.staff_id = s.id
               AND a.status IN ('scheduled', 'arrived')
               AND tstzrange(a.starts_at, a.ends_at) && tstzrange($3, $4)
           )
         LIMIT 1`,
        [salon.id, service.id, startsAt.toISOString(), endsAt.toISOString()]
      );

      if (candidateStaff.rows.length === 0) {
        return NextResponse.json(
          {
            isOverlap: true,
            error: 'This time was just taken, please pick another.',
          },
          { status: 409 }
        );
      }

      finalStaffId = candidateStaff.rows[0].id;
    }

    // 5. Customer upsert
    let customerId: string;
    const cleanMobile = mobile.trim();
    const cleanName = name.trim();
    const cleanPin = (code || '1234').trim();

    const existingCust = await query(
      `SELECT id, name, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
      [salon.id, cleanMobile]
    );

    if (existingCust.rows.length > 0) {
      customerId = existingCust.rows[0].id;
      // Update name and maintain PIN
      await query(
        `UPDATE customers SET name = $1, pin = COALESCE(pin, $2) WHERE id = $3`,
        [cleanName, cleanPin, customerId]
      );
    } else {
      const newCust = await query(
        `INSERT INTO customers (salon_id, name, mobile, pin) VALUES ($1, $2, $3, $4) RETURNING id`,
        [salon.id, cleanName, cleanMobile, cleanPin]
      );
      customerId = newCust.rows[0].id;
    }

    // 6. Insert appointment with database exclusion protection
    let newAppt;
    try {
      const apptRes = await query(
        `INSERT INTO appointments (
          salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'scheduled', 'online', $7
        ) RETURNING *`,
        [
          salon.id,
          customerId,
          finalStaffId,
          service.id,
          startsAt.toISOString(),
          endsAt.toISOString(),
          note || 'Booked online',
        ]
      );
      newAppt = apptRes.rows[0];
    } catch (dbErr: any) {
      // 23P01 is Postgres EXCLUDE constraint violation
      if (dbErr.code === '23P01' || dbErr.message?.includes('no_overlap')) {
        return NextResponse.json(
          {
            isOverlap: true,
            error: 'This time was just taken, please pick another.',
          },
          { status: 409 }
        );
      }
      throw dbErr;
    }

    // Fetch staff details for confirmation
    const staffRes = await query(`SELECT name FROM staff WHERE id = $1`, [finalStaffId]);
    const staffName = staffRes.rows[0]?.name || 'Our Stylist';

    // Format human-readable date and time for confirmation
    const formattedDate = startsAt.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = startsAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const whatsappMessage = `Hi ${cleanName.split(' ')[0]}, your appointment for *${service.name}* at *${salon.name}* is confirmed for *${formattedDate} at ${formattedTime}* with *${staffName}*. See you soon! ✨`;

    const token = await createCustomerSessionToken({
      customerId,
      mobile: cleanMobile,
      name: cleanName,
      salonId: salon.id,
    });

    const response = NextResponse.json({
      success: true,
      appointment: newAppt,
      salonName: salon.name,
      serviceName: service.name,
      staffName,
      formattedDate,
      formattedTime,
      whatsappMessage,
      cleanName,
      cleanMobile,
      customerId,
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
