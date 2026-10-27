import { query } from '@/lib/db';

let cachedSalonId: string | null = null;

export async function getDefaultSalonId(): Promise<string> {
  if (cachedSalonId) return cachedSalonId;

  const res = await query('SELECT id FROM salons ORDER BY created_at ASC LIMIT 1');
  if (res.rows.length > 0 && res.rows[0].id) {
    cachedSalonId = res.rows[0].id;
    return cachedSalonId as string;
  }

  // Fallback to seeded Glow Studio UUID
  return 'e0a1b2c3-d4e5-4a5b-8c9d-0e1f2a3b4c5d';
}
