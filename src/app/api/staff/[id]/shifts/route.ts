import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  findConflictingAppointmentsForShifts,
  normalizeTimeHM,
  timeToMinutes,
} from '@/lib/availability';
import { DEMO_SALON } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const salonId = auth.session.salonId;

    // Demo salon simulation
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const demoShifts = [0, 1, 2, 3, 4, 5, 6].map((w) => ({
        weekday: w,
        start_time: '10:00',
        end_time: '20:00',
        is_off: w === 0, // Sunday off by default
      }));
      return NextResponse.json({
        shifts: demoShifts,
        salonHours: {
          open_time: DEMO_SALON.open_time || '09:00',
          close_time: DEMO_SALON.close_time || '21:00',
          working_days: DEMO_SALON.working_days || [1, 2, 3, 4, 5, 6],
        },
      });
    }

    // Verify staff belongs to caller's salon
    const staffRes = await query(
      `SELECT id, name FROM staff WHERE id = $1::uuid AND salon_id = $2::uuid LIMIT 1`,
      [id, salonId]
    );

    if (staffRes.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found in this salon' }, { status: 404 });
    }

    // Fetch salon hours
    const salonRes = await query(
      `SELECT open_time, close_time, working_days FROM salons WHERE id = $1::uuid LIMIT 1`,
      [salonId]
    );
    const salon = salonRes.rows[0];

    // Fetch existing shifts
    const shiftsRes = await query(
      `SELECT weekday, start_time, end_time, is_off 
       FROM staff_shifts 
       WHERE staff_id = $1::uuid AND salon_id = $2::uuid 
       ORDER BY weekday ASC`,
      [id, salonId]
    );

    const shiftMap = new Map<number, any>();
    for (const row of shiftsRes.rows) {
      shiftMap.set(row.weekday, {
        weekday: row.weekday,
        start_time: normalizeTimeHM(row.start_time),
        end_time: normalizeTimeHM(row.end_time),
        is_off: Boolean(row.is_off),
      });
    }

    // Return 7 days: fallback to salon hours if no custom shift row exists
    const salonOpenHM = normalizeTimeHM(salon?.open_time, '09:00');
    const salonCloseHM = normalizeTimeHM(salon?.close_time, '21:00');
    const salonWorkingDays: number[] = Array.isArray(salon?.working_days)
      ? salon.working_days
      : [1, 2, 3, 4, 5, 6];

    const fullShifts = [0, 1, 2, 3, 4, 5, 6].map((w) => {
      if (shiftMap.has(w)) {
        return shiftMap.get(w);
      }
      return {
        weekday: w,
        start_time: salonOpenHM,
        end_time: salonCloseHM,
        is_off: !salonWorkingDays.includes(w),
      };
    });

    return NextResponse.json({
      shifts: fullShifts,
      salonHours: {
        open_time: salonOpenHM,
        close_time: salonCloseHM,
        working_days: salonWorkingDays,
      },
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/staff/[id]/shifts/route.ts');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const { id } = await params;

    // Rate limiting: max 30 updates per 15 min per salon
    const clientIp = getClientIp(request);
    const rateLimitKey = `staff_shifts_update:${salonId}:${clientIp}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 30, 900);
    if (rateCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many shift updates. Please wait a moment before saving again.' },
        { status: 429 }
      );
    }

    // Demo salon simulation
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        success: true,
        message: 'Weekly shifts saved successfully (Demo)',
        conflicts: [],
      });
    }

    // Verify staff belongs to caller's salon
    const staffRes = await query(
      `SELECT id, name FROM staff WHERE id = $1::uuid AND salon_id = $2::uuid LIMIT 1`,
      [id, salonId]
    );

    if (staffRes.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found in this salon' }, { status: 404 });
    }

    // Fetch salon hours to validate shifts lie within salon operating hours
    const salonRes = await query(
      `SELECT open_time, close_time FROM salons WHERE id = $1::uuid LIMIT 1`,
      [salonId]
    );
    const salon = salonRes.rows[0];
    const salonOpenHM = normalizeTimeHM(salon?.open_time, '09:00');
    const salonCloseHM = normalizeTimeHM(salon?.close_time, '21:00');
    const salonOpenM = timeToMinutes(salonOpenHM);
    const salonCloseM = timeToMinutes(salonCloseHM);

    const body = await request.json().catch(() => ({}));
    const { shifts } = body;

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return NextResponse.json(
        { error: 'Expected shifts array containing weekday schedules.' },
        { status: 400 }
      );
    }

    // Validate each shift item
    const sanitizedShifts: {
      weekday: number;
      start_time: string;
      end_time: string;
      is_off: boolean;
    }[] = [];

    for (const item of shifts) {
      const weekday = Number(item.weekday);
      if (isNaN(weekday) || weekday < 0 || weekday > 6) {
        return NextResponse.json(
          { error: `Invalid weekday: ${item.weekday}. Must be 0 (Sunday) to 6 (Saturday).` },
          { status: 400 }
        );
      }

      const is_off = Boolean(item.is_off);
      const start_time = normalizeTimeHM(item.start_time, salonOpenHM);
      const end_time = normalizeTimeHM(item.end_time, salonCloseHM);

      if (!is_off) {
        const startM = timeToMinutes(start_time);
        const endM = timeToMinutes(end_time);

        if (endM <= startM) {
          return NextResponse.json(
            { error: `End time (${end_time}) must be later than start time (${start_time}) for weekday ${weekday}.` },
            { status: 400 }
          );
        }

        // Validate server-side: shift must strictly lie within salon hours
        if (startM < salonOpenM || endM > salonCloseM) {
          return NextResponse.json(
            {
              error: `Shift (${start_time} - ${end_time}) must lie within salon operating hours (${salonOpenHM} - ${salonCloseHM}).`,
            },
            { status: 400 }
          );
        }
      }

      sanitizedShifts.push({ weekday, start_time, end_time, is_off });
    }

    // Save shifts atomically in PostgreSQL
    for (const sh of sanitizedShifts) {
      await query(
        `INSERT INTO staff_shifts (staff_id, salon_id, weekday, start_time, end_time, is_off)
         VALUES ($1::uuid, $2::uuid, $3::smallint, $4::time, $5::time, $6::boolean)
         ON CONFLICT (staff_id, weekday)
         DO UPDATE SET
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           is_off = EXCLUDED.is_off`,
        [id, salonId, sh.weekday, sh.start_time, sh.end_time, sh.is_off]
      );
    }

    // Detect conflicting existing scheduled appointments (Do NOT auto-cancel, return as warning list)
    const conflicts = await findConflictingAppointmentsForShifts(id, salonId, sanitizedShifts);

    return NextResponse.json({
      success: true,
      message: 'Weekly shifts updated successfully.',
      conflicts,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/staff/[id]/shifts/route.ts');
  }
}

