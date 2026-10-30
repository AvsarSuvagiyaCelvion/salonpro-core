import { query } from './db';

export interface AvailableSlot {
  time: string; // "10:00"
  formattedTime: string; // "10:00 AM"
  staffId: string;
  staffName: string;
}

export interface SlotAvailabilityResult {
  salon: {
    id: string;
    name: string;
    slug: string;
    brand_color: string;
    logo_url: string | null;
    open_time: string;
    close_time: string;
    working_days: number[];
    slot_minutes: number;
    buffer_minutes: number;
    min_advance_hours: number;
    max_advance_days: number;
  };
  service: {
    id: string;
    name: string;
    duration_min: number;
    price: number;
  };
  date: string;
  isClosedDay: boolean;
  slots: AvailableSlot[];
}

/**
 * Parses time string like "10:00:00" or "10:00" into minutes from midnight
 */
function timeToMinutes(t: string): number {
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Converts minutes from midnight to "HH:MM"
 */
function minutesToTime(m: number): string {
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Formats "HH:MM" to "10:00 AM"
 */
function formatTime12h(t: string): string {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h.toString().padStart(2, '0')}:${mStr} ${suffix}`;
}

export async function getAvailableSlots(params: {
  salonSlug?: string;
  salonId?: string;
  serviceId: string;
  staffId?: string; // specific UUID or 'anyone'
  date: string; // 'YYYY-MM-DD'
}): Promise<SlotAvailabilityResult> {
  const { salonSlug, salonId, serviceId, staffId = 'anyone', date } = params;

  // 1. Fetch salon
  let salonRes;
  if (salonSlug) {
    salonRes = await query(`SELECT * FROM salons WHERE slug = $1 LIMIT 1`, [salonSlug]);
  } else if (salonId) {
    salonRes = await query(`SELECT * FROM salons WHERE id = $1 LIMIT 1`, [salonId]);
  } else {
    throw new Error('Salon identifier required');
  }

  if (salonRes.rows.length === 0) {
    throw new Error('Salon not found');
  }

  const salon = salonRes.rows[0];

  // If online booking is disabled by the salon owner
  if (salon.booking_enabled === false) {
    return {
      salon,
      service: { id: serviceId, name: 'Service', duration_min: 30, price: 0 },
      date,
      isClosedDay: true,
      slots: [],
    };
  }

  // 2. Fetch service
  const serviceRes = await query(
    `SELECT id, name, duration_min, price, online_enabled 
     FROM services 
     WHERE id = $1 AND salon_id = $2 LIMIT 1`,
    [serviceId, salon.id]
  );

  if (serviceRes.rows.length === 0) {
    throw new Error('Service not found');
  }

  const service = serviceRes.rows[0];

  // 3. Verify date and working days (Indian Standard Time: Asia/Kolkata)
  const targetDate = new Date(`${date}T00:00:00+05:30`);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  const isClosedDay = !salon.working_days.includes(dayOfWeek);
  if (isClosedDay) {
    return {
      salon,
      service,
      date,
      isClosedDay: true,
      slots: [],
    };
  }

  // Check advance days limit against current IST date
  const now = new Date();
  const todayISTStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayIST = new Date(`${todayISTStr}T00:00:00+05:30`);
  const diffDays = Math.ceil((targetDate.getTime() - todayIST.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0 || diffDays > salon.max_advance_days) {
    return {
      salon,
      service,
      date,
      isClosedDay: false,
      slots: [],
    };
  }

  // 4. Fetch eligible staff
  let eligibleStaff: any[] = [];
  if (staffId && staffId !== 'anyone') {
    const singleStaff = await query(
      `SELECT s.id, s.name 
       FROM staff s
       WHERE s.id = $1 AND s.salon_id = $2 AND s.active = true AND s.show_online = true
       AND (
         NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id)
         OR EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id AND service_id = $3)
       )
       LIMIT 1`,
      [staffId, salon.id, service.id]
    );
    eligibleStaff = singleStaff.rows;
  } else {
    const allStaff = await query(
      `SELECT s.id, s.name 
       FROM staff s
       WHERE s.salon_id = $1 AND s.active = true AND s.show_online = true
       AND (
         NOT EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id)
         OR EXISTS (SELECT 1 FROM staff_services WHERE staff_id = s.id AND service_id = $2)
       )
       ORDER BY s.name ASC`,
      [salon.id, service.id]
    );
    eligibleStaff = allStaff.rows;
  }

  if (eligibleStaff.length === 0) {
    return {
      salon,
      service,
      date,
      isClosedDay: false,
      slots: [],
    };
  }

  const staffIds = eligibleStaff.map((s) => s.id);

  // 5. Fetch existing appointments for eligible staff on this date (in IST)
  const dayStart = `${date}T00:00:00+05:30`;
  const dayEnd = `${date}T23:59:59+05:30`;

  const apptRes = await query(
    `SELECT staff_id, starts_at, ends_at 
     FROM appointments 
     WHERE salon_id = $1 
       AND staff_id = ANY($2::uuid[])
       AND status IN ('scheduled', 'arrived')
       AND starts_at < $4
       AND ends_at > $3`,
    [salon.id, staffIds, dayStart, dayEnd]
  );

  const existingAppts = apptRes.rows;

  // 6. Generate candidate slots inside salon open/close hours
  const openMins = timeToMinutes(salon.open_time);
  const closeMins = timeToMinutes(salon.close_time);
  const slotStep = salon.slot_minutes || 30;
  const bufferMins = salon.buffer_minutes || 10;
  const durationMins = service.duration_min || 30;

  const minAdvanceMs = (salon.min_advance_hours || 1) * 3600 * 1000;
  const minBookableTime = new Date(now.getTime() + minAdvanceMs);

  const availableSlots: AvailableSlot[] = [];

  for (let m = openMins; m + durationMins <= closeMins; m += slotStep) {
    const timeStr = minutesToTime(m);
    // Explicitly parse in Indian Standard Time (Asia/Kolkata, UTC+05:30)
    const candidateStart = new Date(`${date}T${timeStr}:00+05:30`);
    const candidateEnd = new Date(candidateStart.getTime() + durationMins * 60000);

    // Rule: Past time slots must NOT be shown! If slot has already passed in IST, skip it!
    if (candidateStart.getTime() <= now.getTime()) {
      continue;
    }

    // Check if slot start time satisfies minimum advance hours
    if (candidateStart.getTime() < minBookableTime.getTime()) {
      continue;
    }

    // Candidate slot interval with buffer for collision checking
    // Any overlap with an existing appt (which also gets buffer padding) is a conflict
    const candidateStartMs = candidateStart.getTime();
    const candidateEndWithBufferMs = candidateEnd.getTime() + bufferMins * 60000;

    // Find first free eligible staff for this slot
    let freeStaff: any = null;

    for (const staff of eligibleStaff) {
      const staffAppts = existingAppts.filter((a) => a.staff_id === staff.id);

      const hasConflict = staffAppts.some((a) => {
        const apptStartMs = new Date(a.starts_at).getTime();
        const apptEndWithBufferMs = new Date(a.ends_at).getTime() + bufferMins * 60000;
        // Check interval overlap: max(start1, start2) < min(end1, end2)
        return candidateStartMs < apptEndWithBufferMs && candidateEndWithBufferMs > apptStartMs;
      });

      if (!hasConflict) {
        freeStaff = staff;
        break; // Found free staff
      }
    }

    if (freeStaff) {
      availableSlots.push({
        time: timeStr,
        formattedTime: formatTime12h(timeStr),
        staffId: freeStaff.id,
        staffName: freeStaff.name,
      });
    }
  }

  return {
    salon,
    service,
    date,
    isClosedDay: false,
    slots: availableSlots,
  };
}
