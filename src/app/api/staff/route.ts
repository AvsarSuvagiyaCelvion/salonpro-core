import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDefaultSalonId } from '@/lib/salon';

export async function GET() {
  try {
    const salonId = await getDefaultSalonId();
    const staffRes = await query(
      `SELECT s.id, s.salon_id, s.name, s.role_title, 
              s.service_commission_pct, s.product_commission_pct, 
              s.active, s.show_online, s.created_at,
              COALESCE(
                json_agg(
                  json_build_object('id', sv.id, 'name', sv.name)
                ) FILTER (WHERE sv.id IS NOT NULL), 
                '[]'
              ) as services
       FROM staff s
       LEFT JOIN staff_services ss ON s.id = ss.staff_id
       LEFT JOIN services sv ON ss.service_id = sv.id
       WHERE s.salon_id = $1
       GROUP BY s.id
       ORDER BY s.created_at ASC`,
      [salonId]
    );

    return NextResponse.json({ staff: staffRes.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const salonId = await getDefaultSalonId();
    const body = await request.json();
    const {
      name,
      role_title,
      service_commission_pct,
      product_commission_pct,
      services, // array of service_ids
      show_online,
      active,
    } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Staff name is required' }, { status: 400 });
    }

    const sComm = parseFloat(service_commission_pct) || 0;
    const pComm = parseFloat(product_commission_pct) || 0;

    const staffRes = await query(
      `INSERT INTO staff (salon_id, name, role_title, service_commission_pct, product_commission_pct, active, show_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        salonId,
        name.trim(),
        role_title?.trim() || 'Stylist',
        sComm,
        pComm,
        active ?? true,
        show_online ?? true,
      ]
    );

    const newStaff = staffRes.rows[0];

    // Insert staff services if selected
    if (Array.isArray(services) && services.length > 0) {
      for (const srvId of services) {
        await query(
          `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newStaff.id, srvId]
        );
      }
    }

    return NextResponse.json({ staff: newStaff, message: 'Staff member added successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
