import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { requireFeature, invalidateSalonPlanCache } from '@/lib/plan';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const res = await query(
      `SELECT id, name, slug, address, phone, brand_color, logo_url, custom_domain, custom_domain_verified,
              booking_enabled, open_time, close_time, slot_minutes, buffer_minutes,
              working_days, min_advance_hours, max_advance_days, send_reminders,
              trial_ends_at, subscription_status, subscription_ends_at, subscription_plan_id
       FROM salons
       WHERE id = $1
       LIMIT 1`,
      [salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json({
      salon: res.rows[0],
      user: {
        email: auth.session.email,
        role: auth.session.role || 'owner',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleUpdateSettings(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();

    const {
      name,
      address,
      phone,
      brand_color,
      logo_url,
      custom_domain,
      booking_enabled,
      open_time,
      close_time,
      slot_minutes,
      buffer_minutes,
      working_days,
      min_advance_hours,
      max_advance_days,
      send_reminders,
    } = body;

    // Feature gating: logo_upload
    if (logo_url !== undefined && logo_url) {
      const logoCheck = await requireFeature('logo_upload', salonId);
      if (!logoCheck.success) return logoCheck.error;
    }

    // Feature gating: custom_domain and custom_domain_verified
    if (custom_domain !== undefined && custom_domain) {
      const domainCheck = await requireFeature('custom_domain', salonId);
      if (!domainCheck.success) return domainCheck.error;

      const salonCheck = await query('SELECT custom_domain_verified FROM salons WHERE id = $1', [salonId]);
      if (!salonCheck.rows[0]?.custom_domain_verified) {
        return NextResponse.json(
          {
            error: 'Custom domain is a Premium feature and requires DNS verification by platform administration. Please contact support.',
            code: 'DOMAIN_UNVERIFIED',
            feature: 'custom_domain',
            requiredPlan: 'Premium',
          },
          { status: 403 }
        );
      }
    }

    // Sanitize time formats (e.g. "10:00" or "10:00:00" -> "10:00:00")
    function cleanTime(t: any): string | null {
      if (!t || typeof t !== 'string') return null;
      const parts = t.trim().split(':');
      if (parts.length < 2) return null;
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}:00`;
    }

    const cleanedOpenTime = cleanTime(open_time);
    const cleanedCloseTime = cleanTime(close_time);

    const res = await query(
      `UPDATE salons
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           phone = COALESCE($3, phone),
           brand_color = COALESCE($4, brand_color),
           logo_url = COALESCE($5, logo_url),
           booking_enabled = COALESCE($6, booking_enabled),
           open_time = COALESCE($7, open_time),
           close_time = COALESCE($8, close_time),
           slot_minutes = COALESCE($9, slot_minutes),
           buffer_minutes = COALESCE($10, buffer_minutes),
           working_days = COALESCE($11, working_days),
           min_advance_hours = COALESCE($12, min_advance_hours),
           max_advance_days = COALESCE($13, max_advance_days),
           send_reminders = COALESCE($14, send_reminders),
           custom_domain = COALESCE($15, custom_domain)
       WHERE id = $16
       RETURNING *`,
      [
        name,
        address,
        phone,
        brand_color,
        logo_url,
        booking_enabled,
        cleanedOpenTime,
        cleanedCloseTime,
        slot_minutes,
        buffer_minutes,
        working_days,
        min_advance_hours,
        max_advance_days,
        send_reminders,
        custom_domain,
        salonId,
      ]
    );

    invalidateSalonPlanCache(salonId);

    return NextResponse.json({
      success: true,
      salon: res.rows[0],
      message: 'Salon settings saved successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return handleUpdateSettings(request);
}

export async function PATCH(request: Request) {
  return handleUpdateSettings(request);
}
