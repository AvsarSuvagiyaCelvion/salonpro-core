import { query } from './db';
import { DEMO_STAFF, DEMO_SALON } from './demo-data';

export interface StaffWorkingWindow {
  isWorking: boolean;
  start: string | null; // e.g. "09:00"
  end: string | null;   // e.g. "21:00"
  reason:
    | 'working'
    | 'inactive'
    | 'salon_closed_weekday'
    | 'salon_holiday'
    | 'staff_leave'
    | 'staff_shift_off'
    | 'not_found';
  leaveReason?: string | null;
  holidayTitle?: string | null;
}

export interface ConflictingAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  customer_mobile: string;
  service_name: string;
  formatted_date: string;
  formatted_time: string;
}

/**
 * Normalizes time string to "HH:MM"
 */
export function normalizeTimeHM(t: string | null | undefined, fallback = '09:00'): string {
  if (!t) return fallback;
  const parts = t.split(':');
  const h = parts[0]?.padStart(2, '0') || '09';
  const m = parts[1]?.padStart(2, '0') || '00';
  return `${h}:${m}`;
}

/**
 * Converts "HH:MM" or "HH:MM:SS" into minutes from midnight
 */
export function timeToMinutes(t: string): number {
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Primary availability helper:
 * Computes a stylist's working window for a specific date in IST (Asia/Kolkata),
 * combining salon hours, salon working days, salon holidays, staff shifts, and staff leaves.
 */
export async function getStaffWorkingWindow(
  staffId: string,
  date: string, // YYYY-MM-DD
  options?: {
    salonId?: string;
    salon?: any;
    dbClient?: any;
  }
): Promise<StaffWorkingWindow> {
  const runQuery = options?.dbClient
    ? (text: string, params?: any[]) => options.dbClient.query(text, params)
    : query;

  // 1. Static Demo Salon Support
  if (
    staffId.startsWith('stf-demo-') ||
    options?.salon?.slug === 'dixa-beauty-salon' ||
    DEMO_STAFF.some((s) => s.id === staffId)
  ) {
    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
    const isWorkingDay = (DEMO_SALON.working_days || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);
    if (!isWorkingDay) {
      return { isWorking: false, start: null, end: null, reason: 'salon_closed_weekday' };
    }
    return {
      isWorking: true,
      start: normalizeTimeHM(DEMO_SALON.open_time, '09:00'),
      end: normalizeTimeHM(DEMO_SALON.close_time, '21:00'),
      reason: 'working',
    };
  }

  // 2. Fetch staff if needed
  let staffSalonId = options?.salonId;
  let isStaffActive = true;

  const staffRes = await runQuery(
    `SELECT id, salon_id, active FROM staff WHERE id = $1::uuid LIMIT 1`,
    [staffId]
  );

  if (staffRes.rows.length === 0) {
    return { isWorking: false, start: null, end: null, reason: 'not_found' };
  }

  staffSalonId = staffRes.rows[0].salon_id;
  isStaffActive = staffRes.rows[0].active;

  if (!isStaffActive) {
    return { isWorking: false, start: null, end: null, reason: 'inactive' };
  }

  // 3. Fetch salon details if not passed in options
  let salon = options?.salon;
  if (!salon) {
    const salonRes = await runQuery(
      `SELECT id, open_time, close_time, working_days, booking_enabled, is_active 
       FROM salons 
       WHERE id = $1::uuid LIMIT 1`,
      [staffSalonId]
    );
    if (salonRes.rows.length === 0) {
      return { isWorking: false, start: null, end: null, reason: 'not_found' };
    }
    salon = salonRes.rows[0];
  }

  // 4. Weekday & Salon Working Days Check (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  const salonWorkingDays: number[] = Array.isArray(salon.working_days)
    ? salon.working_days
    : [1, 2, 3, 4, 5, 6];

  if (!salonWorkingDays.includes(dayOfWeek)) {
    return { isWorking: false, start: null, end: null, reason: 'salon_closed_weekday' };
  }

  // 5. Salon Holiday / Temporary Closure Check
  const holidayRes = await runQuery(
    `SELECT title, note FROM salon_holidays 
     WHERE salon_id = $1::uuid 
       AND start_date <= $2::date 
       AND end_date >= $2::date 
     LIMIT 1`,
    [staffSalonId, date]
  );

  if (holidayRes.rows.length > 0) {
    return {
      isWorking: false,
      start: null,
      end: null,
      reason: 'salon_holiday',
      holidayTitle: holidayRes.rows[0].title,
    };
  }

  // 6. Staff Leaves Check (Approved/Recorded Leaves)
  const leaveRes = await runQuery(
    `SELECT reason FROM staff_leaves 
     WHERE staff_id = $1::uuid 
       AND from_date <= $2::date 
       AND to_date >= $2::date 
     LIMIT 1`,
    [staffId, date]
  );

  if (leaveRes.rows.length > 0) {
    return {
      isWorking: false,
      start: null,
      end: null,
      reason: 'staff_leave',
      leaveReason: leaveRes.rows[0].reason || 'On Leave',
    };
  }

  // 7. Staff Shifts Check
  const shiftRes = await runQuery(
    `SELECT start_time, end_time, is_off 
     FROM staff_shifts 
     WHERE staff_id = $1::uuid AND weekday = $2::smallint 
     LIMIT 1`,
    [staffId, dayOfWeek]
  );

  const salonOpenHM = normalizeTimeHM(salon.open_time, '09:00');
  const salonCloseHM = normalizeTimeHM(salon.close_time, '21:00');

  // Fallback: If no shift row exists for this weekday, fall back to salon hours
  if (shiftRes.rows.length === 0) {
    return {
      isWorking: true,
      start: salonOpenHM,
      end: salonCloseHM,
      reason: 'working',
    };
  }

  const shift = shiftRes.rows[0];

  // If stylist is explicitly marked off for this day
  if (shift.is_off) {
    return {
      isWorking: false,
      start: null,
      end: null,
      reason: 'staff_shift_off',
    };
  }

  // Shift start and end
  const shiftStartHM = normalizeTimeHM(shift.start_time, salonOpenHM);
  const shiftEndHM = normalizeTimeHM(shift.end_time, salonCloseHM);

  // Shifts must strictly lie within salon hours
  const openM = timeToMinutes(salonOpenHM);
  const closeM = timeToMinutes(salonCloseHM);
  const shiftStartM = Math.max(timeToMinutes(shiftStartHM), openM);
  const shiftEndM = Math.min(timeToMinutes(shiftEndHM), closeM);

  if (shiftStartM >= shiftEndM) {
    return {
      isWorking: false,
      start: null,
      end: null,
      reason: 'staff_shift_off',
    };
  }

  const finalStartHM = `${Math.floor(shiftStartM / 60).toString().padStart(2, '0')}:${(shiftStartM % 60).toString().padStart(2, '0')}`;
  const finalEndHM = `${Math.floor(shiftEndM / 60).toString().padStart(2, '0')}:${(shiftEndM % 60).toString().padStart(2, '0')}`;

  return {
    isWorking: true,
    start: finalStartHM,
    end: finalEndHM,
    reason: 'working',
  };
}

/**
 * Batch availability helper for all staff in a salon on a given date.
 * Optimized with minimal roundtrips for the owner calendar and slot generation.
 */
export async function getStaffWorkingWindowsForDate(
  salonId: string,
  date: string, // YYYY-MM-DD
  staffList?: { id: string; active?: boolean }[]
): Promise<Map<string, StaffWorkingWindow>> {
  const result = new Map<string, StaffWorkingWindow>();

  // 1. Fetch salon
  const salonRes = await query(
    `SELECT id, open_time, close_time, working_days, booking_enabled, slug 
     FROM salons 
     WHERE id = $1::uuid LIMIT 1`,
    [salonId]
  );

  if (salonRes.rows.length === 0) {
    return result;
  }

  const salon = salonRes.rows[0];

  // 2. Resolve staff
  let targetStaff: { id: string; active: boolean }[] = [];
  if (staffList && staffList.length > 0) {
    targetStaff = staffList.map((s) => ({ id: s.id, active: s.active ?? true }));
  } else {
    const stRes = await query(
      `SELECT id, active FROM staff WHERE salon_id = $1::uuid`,
      [salonId]
    );
    targetStaff = stRes.rows;
  }

  if (targetStaff.length === 0) {
    return result;
  }

  const staffIds = targetStaff.map((s) => s.id);

  // 3. Weekday and salon working days check
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  const salonWorkingDays: number[] = Array.isArray(salon.working_days)
    ? salon.working_days
    : [1, 2, 3, 4, 5, 6];

  if (!salonWorkingDays.includes(dayOfWeek)) {
    for (const s of targetStaff) {
      result.set(s.id, {
        isWorking: false,
        start: null,
        end: null,
        reason: 'salon_closed_weekday',
      });
    }
    return result;
  }

  // 4. Salon Holiday check
  const holidayRes = await query(
    `SELECT title, note FROM salon_holidays 
     WHERE salon_id = $1::uuid 
       AND start_date <= $2::date 
       AND end_date >= $2::date 
     LIMIT 1`,
    [salonId, date]
  );

  if (holidayRes.rows.length > 0) {
    const holidayTitle = holidayRes.rows[0].title;
    for (const s of targetStaff) {
      result.set(s.id, {
        isWorking: false,
        start: null,
        end: null,
        reason: 'salon_holiday',
        holidayTitle,
      });
    }
    return result;
  }

  // 5. Batch fetch leaves for all staff on this date
  const leavesRes = await query(
    `SELECT staff_id, reason FROM staff_leaves 
     WHERE staff_id = ANY($1::uuid[])
       AND from_date <= $2::date 
       AND to_date >= $2::date`,
    [staffIds, date]
  );

  const leavesMap = new Map<string, string>();
  for (const row of leavesRes.rows) {
    leavesMap.set(row.staff_id, row.reason || 'On Leave');
  }

  // 6. Batch fetch shifts for all staff on this weekday
  const shiftsRes = await query(
    `SELECT staff_id, start_time, end_time, is_off 
     FROM staff_shifts 
     WHERE staff_id = ANY($1::uuid[]) AND weekday = $2::smallint`,
    [staffIds, dayOfWeek]
  );

  const shiftsMap = new Map<string, { start_time: string; end_time: string; is_off: boolean }>();
  for (const row of shiftsRes.rows) {
    shiftsMap.set(row.staff_id, row);
  }

  const salonOpenHM = normalizeTimeHM(salon.open_time, '09:00');
  const salonCloseHM = normalizeTimeHM(salon.close_time, '21:00');
  const openM = timeToMinutes(salonOpenHM);
  const closeM = timeToMinutes(salonCloseHM);

  // 7. Assemble result for each staff
  for (const s of targetStaff) {
    if (!s.active) {
      result.set(s.id, { isWorking: false, start: null, end: null, reason: 'inactive' });
      continue;
    }

    if (leavesMap.has(s.id)) {
      result.set(s.id, {
        isWorking: false,
        start: null,
        end: null,
        reason: 'staff_leave',
        leaveReason: leavesMap.get(s.id),
      });
      continue;
    }

    const shift = shiftsMap.get(s.id);
    if (!shift) {
      // Fallback: Salon hours
      result.set(s.id, {
        isWorking: true,
        start: salonOpenHM,
        end: salonCloseHM,
        reason: 'working',
      });
      continue;
    }

    if (shift.is_off) {
      result.set(s.id, {
        isWorking: false,
        start: null,
        end: null,
        reason: 'staff_shift_off',
      });
      continue;
    }

    const shiftStartHM = normalizeTimeHM(shift.start_time, salonOpenHM);
    const shiftEndHM = normalizeTimeHM(shift.end_time, salonCloseHM);
    const shiftStartM = Math.max(timeToMinutes(shiftStartHM), openM);
    const shiftEndM = Math.min(timeToMinutes(shiftEndHM), closeM);

    if (shiftStartM >= shiftEndM) {
      result.set(s.id, {
        isWorking: false,
        start: null,
        end: null,
        reason: 'staff_shift_off',
      });
      continue;
    }

    const finalStartHM = `${Math.floor(shiftStartM / 60).toString().padStart(2, '0')}:${(shiftStartM % 60).toString().padStart(2, '0')}`;
    const finalEndHM = `${Math.floor(shiftEndM / 60).toString().padStart(2, '0')}:${(shiftEndM % 60).toString().padStart(2, '0')}`;

    result.set(s.id, {
      isWorking: true,
      start: finalStartHM,
      end: finalEndHM,
      reason: 'working',
    });
  }

  return result;
}

/**
 * Finds existing scheduled or arrived appointments for a staff member that conflict
 * with an added leave or changed shifts.
 * Note: These appointments are NOT auto-cancelled; they are returned as warnings for the owner.
 */
export async function findConflictingAppointmentsForLeave(
  staffId: string,
  salonId: string,
  fromDate: string, // YYYY-MM-DD
  toDate: string   // YYYY-MM-DD
): Promise<ConflictingAppointment[]> {
  const res = await query(
    `SELECT a.id, a.starts_at, a.ends_at, 
            c.name as customer_name, c.mobile as customer_mobile,
            s.name as service_name
     FROM appointments a
     JOIN customers c ON a.customer_id = c.id
     JOIN services s ON a.service_id = s.id
     WHERE a.staff_id = $1::uuid 
       AND a.salon_id = $2::uuid 
       AND a.status IN ('scheduled', 'arrived')
       AND (a.starts_at AT TIME ZONE 'Asia/Kolkata')::date >= $3::date
       AND (a.starts_at AT TIME ZONE 'Asia/Kolkata')::date <= $4::date
     ORDER BY a.starts_at ASC`,
    [staffId, salonId, fromDate, toDate]
  );

  return res.rows.map((row) => formatConflictingAppt(row));
}

export async function findConflictingAppointmentsForShifts(
  staffId: string,
  salonId: string,
  newShifts: { weekday: number; start_time: string; end_time: string; is_off: boolean }[]
): Promise<ConflictingAppointment[]> {
  // Check upcoming scheduled/arrived appointments from today onwards (next 60 days)
  const res = await query(
    `SELECT a.id, a.starts_at, a.ends_at,
            c.name as customer_name, c.mobile as customer_mobile,
            s.name as service_name,
            EXTRACT(DOW FROM (a.starts_at AT TIME ZONE 'Asia/Kolkata'))::int as dow,
            (a.starts_at AT TIME ZONE 'Asia/Kolkata')::time as appt_start_time,
            (a.ends_at AT TIME ZONE 'Asia/Kolkata')::time as appt_end_time
     FROM appointments a
     JOIN customers c ON a.customer_id = c.id
     JOIN services s ON a.service_id = s.id
     WHERE a.staff_id = $1::uuid 
       AND a.salon_id = $2::uuid 
       AND a.status IN ('scheduled', 'arrived')
       AND a.starts_at >= NOW()
       AND a.starts_at <= NOW() + INTERVAL '60 days'
     ORDER BY a.starts_at ASC`,
    [staffId, salonId]
  );

  const shiftMap = new Map<number, { start_time: string; end_time: string; is_off: boolean }>();
  for (const sh of newShifts) {
    shiftMap.set(sh.weekday, sh);
  }

  const conflicts: ConflictingAppointment[] = [];

  for (const appt of res.rows) {
    const shift = shiftMap.get(appt.dow);
    if (!shift) continue; // No shift defined for this weekday: falls back to salon hours, no conflict

    let isConflict = false;
    if (shift.is_off) {
      isConflict = true;
    } else {
      const shiftStartM = timeToMinutes(normalizeTimeHM(shift.start_time));
      const shiftEndM = timeToMinutes(normalizeTimeHM(shift.end_time));
      const apptStartM = timeToMinutes(appt.appt_start_time.toString().slice(0, 5));
      const apptEndM = timeToMinutes(appt.appt_end_time.toString().slice(0, 5));

      if (apptStartM < shiftStartM || apptEndM > shiftEndM) {
        isConflict = true;
      }
    }

    if (isConflict) {
      conflicts.push(formatConflictingAppt(appt));
    }
  }

  return conflicts;
}

function formatConflictingAppt(row: any): ConflictingAppointment {
  const startDate = new Date(row.starts_at);
  const formatted_date = startDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formatted_time = startDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    customer_name: row.customer_name,
    customer_mobile: row.customer_mobile,
    service_name: row.service_name,
    formatted_date,
    formatted_time,
  };
}

