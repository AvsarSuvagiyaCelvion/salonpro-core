import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch salon
    const salonRes = await query(
      `SELECT id, name, slug, brand_color, logo_url, open_time, close_time, 
              working_days, slot_minutes, buffer_minutes, min_advance_hours, max_advance_days
       FROM salons 
       WHERE slug = $1 
       LIMIT 1`,
      [slug]
    );

    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const salon = salonRes.rows[0];

    // Fetch services enabled for online booking
    const servicesRes = await query(
      `SELECT id, name, category, description, duration_min, price 
       FROM services 
       WHERE salon_id = $1 AND online_enabled = true 
       ORDER BY category ASC, name ASC`,
      [salon.id]
    );

    // Fetch staff that show online
    const staffRes = await query(
      `SELECT id, name, role_title 
       FROM staff 
       WHERE salon_id = $1 AND active = true AND show_online = true 
       ORDER BY name ASC`,
      [salon.id]
    );

    // Fetch staff service mappings
    const mappingRes = await query(
      `SELECT ss.staff_id, ss.service_id 
       FROM staff_services ss
       JOIN staff s ON ss.staff_id = s.id
       WHERE s.salon_id = $1`,
      [salon.id]
    );

    return NextResponse.json({
      salon,
      services: servicesRes.rows,
      staff: staffRes.rows,
      staffServices: mappingRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
