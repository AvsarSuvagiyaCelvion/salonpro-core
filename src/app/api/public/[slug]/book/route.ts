import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { createCustomerSessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/auth';
import { getSalonPlan } from '@/lib/plan';
import { normalizeMobile } from '@/lib/phone';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rate-limit';
import { checkDateHoliday } from '@/lib/holidays';
import bcrypt from 'bcryptjs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  let client: any = null;
  let inTransaction = false;

  try {
    const clientIp = getClientIp(request);
    const ipRateLimitKey = `public_book_ip:${clientIp}`;

    // IP rate limit: 20 attempts per 15 minutes
    const ipCheck = await checkRateLimit(ipRateLimitKey, 20, 900);
    if (ipCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many booking attempts from this network. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    // Success booking limit per IP: 10 per hour (3600 seconds)
    const successIpKey = `booking_success_ip:${clientIp}`;
    const successIpCheck = await checkRateLimit(successIpKey, 10, 3600);
    if (successIpCheck.isLocked) {
      return NextResponse.json(
        { error: 'Booking frequency limit reached. Please contact the salon directly or wait before creating new bookings.' },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const body = await request.json().catch(() => ({}));

    // Honeypot bot protection: if 'hp' is populated by a spam bot, silently return fake success
    if (body.hp) {
      return NextResponse.json({
        success: true,
        message: 'Appointment confirmed.',
        appointment: { id: 'bk_ok', status: 'scheduled' },
      });
    }

    const {
      service_id,
      staff_id,
      date,
      time,
      name,
      mobile,
      code,
      confirmCode,
      note,
    } = body;

    // Validate date format strictly (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Validate time format strictly (HH:MM or HH:MM:SS)
    if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(time).trim())) {
      return NextResponse.json(
        { error: 'Invalid time format. Expected HH:MM.' },
        { status: 400 }
      );
    }

    // Normalise mobile
    const cleanMobile = normalizeMobile(mobile);
    if (!cleanMobile) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const cleanPin = (code || '').trim();
    if (!cleanPin || cleanPin.length < 4) {
      return NextResponse.json(
        { error: 'Please enter a 4-digit security PIN for your customer portal access.' },
        { status: 400 }
      );
    }

    if (confirmCode !== undefined && cleanPin !== confirmCode?.trim()) {
      return NextResponse.json(
        { error: 'Security PIN and Confirm PIN do not match.' },
        { status: 400 }
      );
    }

    if (!service_id || !name?.trim()) {
      return NextResponse.json(
        { error: 'All fields (Service, Date, Time, Name, Mobile) are required.' },
        { status: 400 }
      );
    }

    // Fetch salon
    const salonRes = await query(
      `SELECT id, name, slug, phone, brand_color, buffer_minutes, is_active,
              open_time, close_time, working_days, min_advance_hours, max_advance_days 
       FROM salons 
       WHERE slug = $1 LIMIT 1`,
      [slug.toLowerCase().trim()]
    );

    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const salon = salonRes.rows[0];

    if (!salon.is_active) {
      return NextResponse.json(
        { error: 'Online booking is temporarily unavailable because this salon workspace is suspended.' },
        { status: 403 }
      );
    }

    // Check if salon subscription / 7-day trial is active
    const planCheck = await getSalonPlan(salon.id);
    if (planCheck.error) {
      return NextResponse.json(
        { error: 'Online booking is temporarily inactive for this salon due to an expired subscription.' },
        { status: 402 }
      );
    }

    // Fetch service
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

    // Calculate starts_at & ends_at in Indian Standard Time (+05:30)
    const rawTime = String(time).trim();
    const cleanT = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
    const startsAt = new Date(`${String(date).trim()}T${cleanT}+05:30`);

    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid appointment date or time.' },
        { status: 400 }
      );
    }

    const endsAt = new Date(startsAt.getTime() + service.duration_min * 60000);

    // Past time validation
    if (startsAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'This time slot is in the past. Please select an upcoming slot.' },
        { status: 400 }
      );
    }

    // Working day validation
    const dayOfWeek = new Date(`${String(date).trim()}T12:00:00Z`).getUTCDay();
    const workingDays =
      salon.working_days && salon.working_days.length > 0
        ? salon.working_days
        : [1, 2, 3, 4, 5, 6];
    if (!workingDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: 'The salon is closed on this day. Please select another date.' },
        { status: 400 }
      );
    }

    // Specific salon holiday / temporary closure validation
    const holidayCheck = await checkDateHoliday(salon.id, String(date).trim());
    if (holidayCheck.isHoliday && holidayCheck.holiday) {
      return NextResponse.json(
        {
          error: `The salon is closed on this date for "${holidayCheck.holiday.title}". ${holidayCheck.holiday.note || 'Please select another date.'}`,
          isHoliday: true,
          holiday: holidayCheck.holiday,
        },
        { status: 400 }
      );
    }

    // Operating hours validation
    const slotStartM =
      parseInt(cleanT.split(':')[0], 10) * 60 + parseInt(cleanT.split(':')[1], 10);
    const slotEndM = slotStartM + service.duration_min;
    const [openH, openMin] = (salon.open_time || '09:00').split(':').map(Number);
    const [closeH, closeMin] = (salon.close_time || '21:00').split(':').map(Number);
    const openM = openH * 60 + (openMin || 0);
    const closeM = closeH * 60 + (closeMin || 0);
    if (slotStartM < openM || slotEndM > closeM) {
      return NextResponse.json(
        {
          error: `The requested time (${cleanT.slice(0, 5)}) is outside salon operating hours (${salon.open_time || '09:00'} - ${salon.close_time || '21:00'}).`,
        },
        { status: 400 }
      );
    }

    // Min advance hours validation
    const minAdvanceHours = Number(salon.min_advance_hours || 0);
    if (minAdvanceHours > 0 && startsAt.getTime() < Date.now() + minAdvanceHours * 3600000) {
      return NextResponse.json(
        { error: `Bookings require at least ${minAdvanceHours} hour(s) advance notice.` },
        { status: 400 }
      );
    }

    // Max advance days validation
    const maxAdvanceDays = Number(salon.max_advance_days || 30);
    if (startsAt.getTime() > Date.now() + maxAdvanceDays * 86400000) {
      return NextResponse.json(
        { error: `Bookings are only accepted up to ${maxAdvanceDays} days in advance.` },
        { status: 400 }
      );
    }

    // Resolve and Validate Staff member
    let finalStaffId = staff_id;
    if (finalStaffId && finalStaffId !== 'anyone') {
      const staffVal = await query(
        `SELECT id, name FROM staff 
         WHERE id = $1 AND salon_id = $2 AND active = true AND show_online = true
           AND (
             NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id = $1)
             OR EXISTS (SELECT 1 FROM staff_services WHERE staff_id = $1 AND service_id = $3)
           )
         LIMIT 1`,
        [finalStaffId, salon.id, service.id]
      );

      if (staffVal.rows.length === 0) {
        return NextResponse.json(
          { error: 'Selected staff member is either not available or does not perform this service.' },
          { status: 400 }
        );
      }
    } else {
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
               AND tstzrange(a.starts_at, a.ends_at) && tstzrange($3::timestamptz, $4::timestamptz)
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

    // Wrong-PIN rate limiting check for this (salon, mobile)
    const pinRateLimitKey = `customer_booking_pin:${salon.id}:${cleanMobile}`;
    const pinCheck = await checkRateLimit(pinRateLimitKey, 5, 900);
    if (pinCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many incorrect PIN attempts for this mobile number. Temporarily locked for 15 minutes.' },
        { status: 429 }
      );
    }

    // 6. ATOMIC TRANSACTION WITH POSTGRES ADVISORY LOCK & EXCLUSION CONSTRAINT
    // Lock on salon + staff only so overlapping slots with different start times are serialized
    client = await pool.connect();
    await client.query('BEGIN');
    inTransaction = true;

    const lockKey = `${salon.id}:${finalStaffId}`;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);

    // Check for overlapping appointment inside the locked transaction
    const conflictCheck = await client.query(
      `SELECT a.id FROM appointments a
       WHERE a.salon_id = $1
         AND a.staff_id = $2
         AND a.status IN ('scheduled', 'arrived')
         AND tstzrange(a.starts_at, a.ends_at) && tstzrange($3::timestamptz, $4::timestamptz)
       LIMIT 1`,
      [salon.id, finalStaffId, startsAt.toISOString(), endsAt.toISOString()]
    );

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      inTransaction = false;
      client.release();
      client = null;
      return NextResponse.json(
        {
          isOverlap: true,
          error: 'This time was just taken, please pick another.',
        },
        { status: 409 }
      );
    }

    // Customer lookup or creation INSIDE transaction
    let customerId: string;
    const cleanName = String(name).trim();

    const existingCust = await client.query(
      `SELECT id, name, pin FROM customers WHERE salon_id = $1 AND mobile = $2 LIMIT 1`,
      [salon.id, cleanMobile]
    );

    if (existingCust.rows.length > 0) {
      customerId = existingCust.rows[0].id;
      const storedPin = existingCust.rows[0].pin;
      if (storedPin) {
        let isMatch = false;
        if (storedPin.startsWith('$2a$') || storedPin.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(cleanPin, storedPin);
        } else {
          isMatch = (storedPin === cleanPin);
        }

        if (!isMatch) {
          await client.query('ROLLBACK');
          inTransaction = false;
          client.release();
          client = null;

          await recordFailedAttempt(pinRateLimitKey, 5, 900);
          await recordFailedAttempt(ipRateLimitKey, 20, 900);

          return NextResponse.json(
            { error: 'Incorrect customer PIN for this mobile number. Please enter your existing PIN or log in first.' },
            { status: 401 }
          );
        }

        // If stored in plaintext, upgrade to bcrypt
        if (!storedPin.startsWith('$2')) {
          const newHash = await bcrypt.hash(cleanPin, 10);
          await client.query('UPDATE customers SET pin = $1 WHERE id = $2', [newHash, customerId]);
        }
      } else {
        const newHash = await bcrypt.hash(cleanPin, 10);
        await client.query('UPDATE customers SET pin = $1 WHERE id = $2', [newHash, customerId]);
      }

      await client.query(
        `UPDATE customers SET name = $1 WHERE id = $2`,
        [cleanName, customerId]
      );
    } else {
      const hashedPin = await bcrypt.hash(cleanPin, 10);
      const newCust = await client.query(
        `INSERT INTO customers (salon_id, name, mobile, pin) VALUES ($1, $2, $3, $4) RETURNING id`,
        [salon.id, cleanName, cleanMobile, hashedPin]
      );
      customerId = newCust.rows[0].id;
    }

    // Insert appointment inside transaction
    const apptRes = await client.query(
      `INSERT INTO appointments (
        salon_id, customer_id, staff_id, service_id, starts_at, ends_at, status, source, note, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'scheduled', 'online', $7, NOW()
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

    await client.query('COMMIT');
    inTransaction = false;
    client.release();
    client = null;

    // Reset wrong-PIN rate limit on success
    await resetRateLimit(pinRateLimitKey);
    // Record successful booking towards IP rate limit
    await recordFailedAttempt(successIpKey, 10, 3600);

    const newAppt = apptRes.rows[0];

    // Fetch staff details for confirmation
    const staffRes = await query(`SELECT name FROM staff WHERE id = $1`, [finalStaffId]);
    const staffName = staffRes.rows[0]?.name || 'Our Stylist';

    // Format human-readable date and time for confirmation (Indian Standard Time)
    const formattedDate = startsAt.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = startsAt.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
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
      salon: {
        name: salon.name,
        phone: salon.phone,
        brandColor: salon.brand_color,
      },
      service: {
        name: service.name,
        price: service.price,
        duration: service.duration_min,
      },
      staff: {
        id: finalStaffId,
        name: staffName,
      },
      formattedDate,
      formattedTime,
      whatsappMessage,
      whatsappLink: `https://wa.me/91${cleanMobile}?text=${encodeURIComponent(whatsappMessage)}`,
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    if (inTransaction && client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    if (client) {
      try {
        client.release();
      } catch {}
    }

    // PostgreSQL EXCLUDE constraint violation (23P01) or UNIQUE violation (23505)
    if (
      error.code === '23P01' ||
      error.code === '23505' ||
      error.message?.includes('exclude_overlapping_appointments') ||
      error.message?.includes('idx_appointments_unique_active_slot') ||
      error.message?.includes('exclusion constraint') ||
      error.message?.includes('conflict')
    ) {
      return NextResponse.json(
        {
          isOverlap: true,
          error: 'This time was just taken, please pick another.',
        },
        { status: 409 }
      );
    }

    console.error('Public booking server error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while processing your booking. Please try again.' },
      { status: 500 }
    );
  }
}
