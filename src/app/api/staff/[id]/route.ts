import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      role_title,
      service_commission_pct,
      product_commission_pct,
      services,
      active,
      show_online,
    } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sComm = parseFloat(service_commission_pct) || 0;
    const pComm = parseFloat(product_commission_pct) || 0;

    const res = await query(
      `UPDATE staff 
       SET name = $1, role_title = $2, service_commission_pct = $3, 
           product_commission_pct = $4, active = $5, show_online = $6
       WHERE id = $7
       RETURNING *`,
      [name.trim(), role_title?.trim() || 'Stylist', sComm, pComm, active, show_online, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Refresh staff services mapping
    if (Array.isArray(services)) {
      await query('DELETE FROM staff_services WHERE staff_id = $1', [id]);
      for (const srvId of services) {
        await query(
          'INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, srvId]
        );
      }
    }

    return NextResponse.json({ staff: res.rows[0], message: 'Staff updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.active !== undefined) {
      updates.push(`active = $${idx++}`);
      values.push(Boolean(body.active));
    }
    if (body.show_online !== undefined) {
      updates.push(`show_online = $${idx++}`);
      values.push(Boolean(body.show_online));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const res = await query(
      `UPDATE staff SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json({ staff: res.rows[0], message: 'Staff status updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query('DELETE FROM staff WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Staff member deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
