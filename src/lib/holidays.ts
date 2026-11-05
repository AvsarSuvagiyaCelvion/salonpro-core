import { query } from './db';

export interface SalonHoliday {
  id: string;
  salon_id: string;
  title: string;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string;   // 'YYYY-MM-DD'
  note: string | null;
  created_at: string;
}

let tableEnsured = false;

/**
 * Ensures salon_holidays table and indices exist
 */
export async function ensureHolidaysTable() {
  if (tableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS salon_holidays (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_salon_holidays_lookup ON salon_holidays (salon_id, start_date, end_date);
    `);
    tableEnsured = true;
  } catch (err) {
    console.error('Notice: ensureHolidaysTable error (table may already exist):', err);
  }
}

/**
 * Fetches all scheduled holidays/closures for a given salon
 */
export async function getSalonHolidays(salonId: string): Promise<SalonHoliday[]> {
  await ensureHolidaysTable();
  const res = await query(
    `SELECT id, salon_id, title, 
            TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, 
            TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, 
            note, created_at
     FROM salon_holidays
     WHERE salon_id = $1
     ORDER BY start_date ASC`,
    [salonId]
  );
  return res.rows;
}

/**
 * Checks whether a specific date falls within any holiday or closure for a salon
 */
export async function checkDateHoliday(
  salonId: string,
  dateStr: string
): Promise<{ isHoliday: boolean; holiday: SalonHoliday | null }> {
  await ensureHolidaysTable();
  const cleanDate = dateStr.trim();
  const res = await query(
    `SELECT id, salon_id, title, 
            TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, 
            TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, 
            note, created_at
     FROM salon_holidays
     WHERE salon_id = $1 
       AND $2::date >= start_date 
       AND $2::date <= end_date
     LIMIT 1`,
    [salonId, cleanDate]
  );

  if (res.rows.length > 0) {
    return { isHoliday: true, holiday: res.rows[0] };
  }
  return { isHoliday: false, holiday: null };
}

/**
 * Adds a new holiday or closure period for a salon
 */
export async function addSalonHoliday(
  salonId: string,
  data: {
    title: string;
    startDate: string;
    endDate: string;
    note?: string | null;
  }
): Promise<SalonHoliday> {
  await ensureHolidaysTable();
  const { title, startDate, endDate, note } = data;

  const res = await query(
    `INSERT INTO salon_holidays (salon_id, title, start_date, end_date, note)
     VALUES ($1, $2, $3::date, $4::date, $5)
     RETURNING id, salon_id, title, 
               TO_CHAR(start_date, 'YYYY-MM-DD') as start_date, 
               TO_CHAR(end_date, 'YYYY-MM-DD') as end_date, 
               note, created_at`,
    [salonId, title.trim(), startDate.trim(), endDate.trim(), note ? note.trim() : null]
  );

  return res.rows[0];
}

/**
 * Deletes a scheduled holiday by ID (strictly isolated to owner's salon)
 */
export async function deleteSalonHoliday(
  salonId: string,
  holidayId: string
): Promise<boolean> {
  await ensureHolidaysTable();
  const res = await query(
    `DELETE FROM salon_holidays WHERE id = $1 AND salon_id = $2 RETURNING id`,
    [holidayId, salonId]
  );
  return res.rows.length > 0;
}

