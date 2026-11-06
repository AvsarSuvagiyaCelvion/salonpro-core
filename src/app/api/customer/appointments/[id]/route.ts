import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool, { query } from '@/lib/db';
import { CUSTOMER_COOKIE_NAME, verifyCustomerSessionToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkDateHoliday } from '@/lib/holidays';
import { serverError } from '@/lib/http';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: any = null;
  let inTransaction = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const payload = await verifyCustomerSessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    const customerId = payload.customerId;

    // Rate limiting: 30 requests per minute per customer
    const rlCheck = await checkRateLimit(`cust_appt_action:${customerId}`, 30, 60);
    if (rlCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const { id: appointmentId } = await params;
    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (!action || !['cancel', 'reschedule'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Expected "cancel" or "reschedule".' },
        { status: 400 }
      );
    }

    // Fetch appointment with salon & service info
    // If appointment doesn't belong to this customer -> return 404
    const apptRes = await query(
      `SELECT a.id, a.salon_id, a.customer_id, a.staff_id, a.service_id, a.starts_at, a.ends_at, a.status,
              a.rescheduled_count, a.source,
              s.name as salon_name, s.slug as salon_slug, s.phone as salon_phone,
              COALESCE(s.cancel_policy_hours, 2) as cancel_policy_hours,
              s.open_time, s.close_time, s.working_days, s.buffer_minutes,
              s.min_advance_hours, s.max_advance_days,
              sv.name as service_name, sv.duration_min, sv.price as service_price
       FROM appointments a
       JOIN salons s ON a.salon_id = s.id
       JOIN services sv ON a.service_id = sv.id
       WHERE a.id = $1::uuid
       LIMIT 1`,
      [appointmentId]
    );

    if (apptRes.rows.length === 0 || apptRes.rows[0].customer_id !== customerId) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const appt = apptRes.rows[0];

    // Status check: only 'scheduled' can be cancelled or rescheduled
    if (appt.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Cannot ${action} appointment with status "${appt.status}". Only scheduled visits can be modified.` },
        { status: 400 }
      );
    }

    // Policy cutoff check: now <= starts_at - policy hours
    const policyHours = Number(appt.cancel_policy_hours ?? 2);
    const startsAt = new Date(appt.starts_at);
    const cutoffTime = startsAt.getTime() - policyHours * 3600 * 1000;
    const now = Date.now();

    if (now > cutoffTime) {
      const salonContact = appt.salon_phone ? ` at ${appt.salon_phone}` : '';
      return NextResponse.json(
        {
          error: `Changes are only permitted up to ${policyHours} hour(s) before the scheduled appointment. Please call ${appt.salon_name}${salonContact} directly.`,
        },
        { status: 400 }
      );
    }

    // Demo salon showcase: "dixa-beauty-salon" simulates success without DB writes
    if (appt.salon_slug === 'dixa-beauty-salon') {
      if (action === 'cancel') {
        return NextResponse.json({
          success: true,
          message: 'Appointment cancelled successfully (Demo)',
          appointment: {
            id: appt.id,
            status: 'cancelled',
            cancelled_by: 'customer',
            cancelled_at: new Date().toISOString(),
          },
        });
      } else {
        // reschedule in demo mode
        const { date, time } = body;
        if (!date || !time) {
          return NextResponse.json({ error: 'Date and time are required for rescheduling.' }, { status: 400 });
        }
        const demoStart = new Date(`${date}T${time}:00+05:30`);
        const demoEnd = new Date(demoStart.getTime() + (appt.duration_min || 30) * 60000);
        return NextResponse.json({
          success: true,
          message: 'Appointment rescheduled successfully (Demo)',
          appointment: {
            id: appt.id,
            starts_at: demoStart.toISOString(),
            ends_at: demoEnd.toISOString(),
            rescheduled_count: Number(appt.rescheduled_count || 0) + 1,
            status: 'scheduled',
          },
        });
      }
    }

    // ---------------- ACTION: CANCEL ----------------
    if (action === 'cancel') {
      const cancelRes = await query(
        `UPDATE appointments
         SET status = 'cancelled',
             cancelled_by = 'customer',
             cancelled_at = NOW()
         WHERE id = $1::uuid AND customer_id = $2::uuid
         RETURNING id, status, cancelled_by, cancelled_at`,
        [appointmentId, customerId]
      );

      if (cancelRes.rows.length === 0) {
        return NextResponse.json({ error: 'Failed to cancel appointment.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment cancelled successfully.',
        appointment: cancelRes.rows[0],
      });
    }

    // ---------------- ACTION: RESCHEDULE ----------------
    if (action === 'reschedule') {
      const currentReschedules = Number(appt.rescheduled_count || 0);
      if (currentReschedules >= 2) {
        return NextResponse.json(
          { error: 'Appointments can only be rescheduled up to 2 times. Please call the salon directly.' },
          { status: 400 }
        );
      }

      const { date, time, staff_id } = body;

      // Validate date format (YYYY-MM-DD)
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
        return NextResponse.json(
          { error: 'Invalid date format. Expected YYYY-MM-DD.' },
          { status: 400 }
        );
      }

      // Validate time format (HH:MM or HH:MM:SS)
      if (!time || !/^\d{2}:\d{2}(:\d{2})?$/.test(String(time).trim())) {
        return NextResponse.json(
          { error: 'Invalid time format. Expected HH:MM.' },
          { status: 400 }
        );
      }

      const cleanTime = String(time).trim().slice(0, 5);
      const newStartsAt = new Date(`${date}T${cleanTime}:00+05:30`);
      const durationMin = Number(appt.duration_min || 30);
      const newEndsAt = new Date(newStartsAt.getTime() + durationMin * 60000);

      // Must not be in the past
      if (newStartsAt.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: 'Cannot reschedule to a past time slot.' },
          { status: 400 }
        );
      }

      // Min advance hours validation
      const minAdvanceHours = Number(appt.min_advance_hours || 0);
      if (minAdvanceHours > 0 && newStartsAt.getTime() < Date.now() + minAdvanceHours * 3600000) {
        return NextResponse.json(
          { error: `Rescheduling requires at least ${minAdvanceHours} hour(s) advance notice.` },
          { status: 400 }
        );
      }

      // Max advance days validation
      const maxAdvanceDays = Number(appt.max_advance_days || 30);
      if (newStartsAt.getTime() > Date.now() + maxAdvanceDays * 86400000) {
        return NextResponse.json(
          { error: `Appointments can only be booked up to ${maxAdvanceDays} days in advance.` },
          { status: 400 }
        );
      }

      // Working days validation (IST)
      const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
      if (Array.isArray(appt.working_days) && !appt.working_days.includes(dayOfWeek)) {
        return NextResponse.json(
          { error: 'The salon is closed on this day of the week.' },
          { status: 400 }
        );
      }

      // Salon holiday / temporary closure
      const holidayCheck = await checkDateHoliday(appt.salon_id, date);
      if (holidayCheck.isHoliday) {
        return NextResponse.json(
          { error: `The salon is closed on this date (${holidayCheck.holiday?.title || 'Holiday'}).` },
          { status: 400 }
        );
      }

      // Operating hours validation
      const [startH, startM] = cleanTime.split(':').map(Number);
      const startTotalMins = startH * 60 + startM;
      const endTotalMins = startTotalMins + durationMin;
      const [openH, openM] = (appt.open_time || '10:00:00').slice(0, 5).split(':').map(Number);
      const [closeH, closeM] = (appt.close_time || '19:00:00').slice(0, 5).split(':').map(Number);
      const openTotalMins = openH * 60 + openM;
      const closeTotalMins = closeH * 60 + closeM;

      if (startTotalMins < openTotalMins || endTotalMins > closeTotalMins) {
        return NextResponse.json(
          { error: 'Selected time is outside salon operating hours.' },
          { status: 400 }
        );
      }

      // Stylist resolution:
      // Keep same stylist ("any" stays "any"), same services/duration.
      let finalStaffId: string;
      const requestedStaffId = staff_id && staff_id !== 'undefined' && staff_id !== 'null' ? staff_id : null;

      if (requestedStaffId && requestedStaffId !== 'anyone') {
        const staffCheck = await query(
          `SELECT id, name FROM staff
           WHERE id = $1::uuid AND salon_id = $2::uuid AND active = true AND show_online = true
             AND (
               NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id = $1::uuid)
               OR EXISTS (SELECT 1 FROM staff_services WHERE staff_id = $1::uuid AND service_id = $3::uuid)
             )
           LIMIT 1`,
          [requestedStaffId, appt.salon_id, appt.service_id]
        );

        if (staffCheck.rows.length === 0) {
          return NextResponse.json(
            { error: 'Selected stylist is not available for this service.' },
            { status: 400 }
          );
        }
        finalStaffId = requestedStaffId;
      } else if (requestedStaffId === 'anyone') {
        const candidateStaff = await query(
          `SELECT s.id, s.name
           FROM staff s
           WHERE s.salon_id = $1::uuid AND s.active = true AND s.show_online = true
             AND (
               NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id)
               OR EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id AND service_id = $2::uuid)
             )
             AND NOT EXISTS (
               SELECT 1 FROM appointments a
               WHERE a.staff_id = s.id
                 AND a.id != $3::uuid
                 AND a.status IN ('scheduled', 'arrived')
                 AND tstzrange(a.starts_at, a.ends_at) && tstzrange($4::timestamptz, $5::timestamptz)
             )
           LIMIT 1`,
          [appt.salon_id, appt.service_id, appt.id, newStartsAt.toISOString(), newEndsAt.toISOString()]
        );

        if (candidateStaff.rows.length === 0) {
          return NextResponse.json(
            {
              isOverlap: true,
              error: 'This time slot was just taken. Please choose another time.',
            },
            { status: 409 }
          );
        }
        finalStaffId = candidateStaff.rows[0].id;
      } else {
        finalStaffId = appt.staff_id;
      }

      // ATOMIC TRANSACTION WITH POSTGRES ADVISORY LOCK
      client = await pool.connect();
      await client.query('BEGIN');
      inTransaction = true;

      const lockKey = `${appt.salon_id}:${finalStaffId}`;
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1::text))', [lockKey]);

      // Overlap check inside lock, excluding the current appointment
      const conflictCheck = await client.query(
        `SELECT a.id FROM appointments a
         WHERE a.salon_id = $1::uuid
           AND a.staff_id = $2::uuid
           AND a.status IN ('scheduled', 'arrived')
           AND a.id != $3::uuid
           AND tstzrange(a.starts_at, a.ends_at) && tstzrange($4::timestamptz, $5::timestamptz)
         LIMIT 1`,
        [appt.salon_id, finalStaffId, appt.id, newStartsAt.toISOString(), newEndsAt.toISOString()]
      );

      if (conflictCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        inTransaction = false;
        client.release();
        client = null;
        return NextResponse.json(
          {
            isOverlap: true,
            error: 'This time slot was just taken. Please choose another time.',
          },
          { status: 409 }
        );
      }

      // Update appointment (Note: appointments table has NO updated_at column)
      const updateRes = await client.query(
        `UPDATE appointments
         SET starts_at = $1::timestamptz,
             ends_at = $2::timestamptz,
             staff_id = $3::uuid,
             rescheduled_count = rescheduled_count + 1
         WHERE id = $4::uuid AND customer_id = $5::uuid
         RETURNING id, starts_at, ends_at, staff_id, rescheduled_count, status`,
        [newStartsAt.toISOString(), newEndsAt.toISOString(), finalStaffId, appt.id, customerId]
      );

      await client.query('COMMIT');
      inTransaction = false;
      client.release();
      client = null;

      return NextResponse.json({
        success: true,
        message: 'Appointment rescheduled successfully.',
        appointment: updateRes.rows[0],
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error: any) {
    if (inTransaction && client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }
    return serverError(error, 'src/app/api/customer/appointments/[id]/route.ts');
  } finally {
    if (client) {
      try {
        client.release();
      } catch {}
    }
  }
}

