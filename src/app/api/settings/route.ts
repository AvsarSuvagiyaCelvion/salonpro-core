import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole, invalidateUserAuthCache } from '@/lib/api-auth';
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
              cancel_policy_hours,
              trial_ends_at, subscription_status, subscription_ends_at, subscription_plan_id
       FROM salons
       WHERE id = $1
       LIMIT 1`,
      [salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        salon: res.rows[0],
        user: {
          email: auth.session.email,
          role: auth.session.role || 'owner',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return serverError(error, 'src/app/api/settings/route.ts');
  }
}

async function handleUpdateSettings(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

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
      cancel_policy_hours,
    } = body;

    // 5.3 Validations on settings updates
    if (brand_color !== undefined && brand_color !== null && brand_color !== '') {
      if (!/^#[0-9a-fA-F]{6}$/.test(String(brand_color).trim())) {
        return NextResponse.json(
          { error: 'Brand color must be a valid 6-digit hex code (e.g. #D4A77F).' },
          { status: 400 }
        );
      }
    }

    if (logo_url !== undefined && logo_url !== null && logo_url !== '') {
      if (!/^https?:\/\//i.test(String(logo_url).trim())) {
        return NextResponse.json(
          { error: 'Logo URL must start with http:// or https://.' },
          { status: 400 }
        );
      }
    }

    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (open_time !== undefined && open_time !== null && open_time !== '') {
      if (!timeRegex.test(String(open_time).trim())) {
        return NextResponse.json({ error: 'Open time must be in HH:MM format.' }, { status: 400 });
      }
    }
    if (close_time !== undefined && close_time !== null && close_time !== '') {
      if (!timeRegex.test(String(close_time).trim())) {
        return NextResponse.json({ error: 'Close time must be in HH:MM format.' }, { status: 400 });
      }
    }
    if (open_time && close_time) {
      const [oh, om] = String(open_time).trim().split(':').map(Number);
      const [ch, cm] = String(close_time).trim().split(':').map(Number);
      if (oh * 60 + om >= ch * 60 + cm) {
        return NextResponse.json({ error: 'Open time must be earlier than close time.' }, { status: 400 });
      }
    }

    if (slot_minutes !== undefined && slot_minutes !== null) {
      const slotInt = parseInt(slot_minutes, 10);
      if (isNaN(slotInt) || slotInt < 5 || slotInt > 240) {
        return NextResponse.json(
          { error: 'Slot minutes must be an integer between 5 and 240 minutes.' },
          { status: 400 }
        );
      }
    }

    if (working_days !== undefined && working_days !== null) {
      if (
        !Array.isArray(working_days) ||
        working_days.length === 0 ||
        !working_days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      ) {
        return NextResponse.json(
          { error: 'Working days must be a non-empty array of days (0=Sunday to 6=Saturday).' },
          { status: 400 }
        );
      }
    }

    if (min_advance_hours !== undefined && min_advance_hours !== null) {
      const minAdv = parseInt(min_advance_hours, 10);
      if (isNaN(minAdv) || minAdv < 0) {
        return NextResponse.json(
          { error: 'Minimum advance hours must be 0 or greater.' },
          { status: 400 }
        );
      }
    }

    if (max_advance_days !== undefined && max_advance_days !== null) {
      const maxAdv = parseInt(max_advance_days, 10);
      if (isNaN(maxAdv) || maxAdv < 1 || maxAdv > 365) {
        return NextResponse.json(
          { error: 'Maximum advance days must be between 1 and 365 days.' },
          { status: 400 }
        );
      }
    }

    let parsedCancelPolicyHours: number | null = null;
    if (cancel_policy_hours !== undefined && cancel_policy_hours !== null && cancel_policy_hours !== '') {
      const cancelHoursInt = parseInt(cancel_policy_hours, 10);
      if (isNaN(cancelHoursInt) || cancelHoursInt < 0 || cancelHoursInt > 72) {
        return NextResponse.json(
          { error: 'Customers can cancel/reschedule up to 0 to 72 hours before.' },
          { status: 400 }
        );
      }
      parsedCancelPolicyHours = cancelHoursInt;
    }

    // Feature gating: logo_upload (only enforce if user is actively changing/uploading a new logo)
    if (logo_url !== undefined && logo_url) {
      const curSalon = await query('SELECT logo_url FROM salons WHERE id = $1', [salonId]);
      const currentLogo = curSalon.rows[0]?.logo_url;
      if (logo_url !== currentLogo) {
        const logoCheck = await requireFeature('logo_upload', salonId);
        if (!logoCheck.success) return logoCheck.error;
      }
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
           custom_domain = COALESCE($15, custom_domain),
           cancel_policy_hours = COALESCE($16::integer, cancel_policy_hours)
       WHERE id = $17::uuid
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
        parsedCancelPolicyHours,
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
    return serverError(error, 'src/app/api/settings/route.ts');
  }
}

export async function PUT(request: Request) {
  return handleUpdateSettings(request);
}

export async function PATCH(request: Request) {
  return handleUpdateSettings(request);
}
