import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { checkLimit } from '@/lib/plan';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const res = await query(
      `SELECT id, salon_id, name, category, description, duration_min, price, online_enabled, created_at
       FROM services
       WHERE salon_id = $1
       ORDER BY category ASC, name ASC`,
      [salonId]
    );

    return NextResponse.json({ services: res.rows });
  } catch (error: any) {
    return serverError(error, 'src/app/api/services/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;

    // Check services plan limits (e.g. Basic: 30 services max)
    const limitCheck = await checkLimit('max_services', salonId);
    if (!limitCheck.success) {
      return limitCheck.error;
    }

    const body = await request.json();
    const { name, category, description, duration_min, price, online_enabled } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    const duration = parseInt(duration_min, 10);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Duration must be a positive number of minutes' }, { status: 400 });
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Price must be a valid non-negative number' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO services (salon_id, name, category, description, duration_min, price, online_enabled, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        salonId,
        name.trim(),
        category.trim(),
        description?.trim() || null,
        duration,
        numericPrice,
        online_enabled ?? true,
      ]
    );

    return NextResponse.json({ service: res.rows[0], message: 'Service added successfully' }, { status: 201 });
  } catch (error: any) {
    return serverError(error, 'src/app/api/services/route.ts');
  }
}
