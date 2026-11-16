import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole, invalidateUserAuthCache } from '@/lib/api-auth';
import { requireFeature, invalidateSalonPlanCache } from '@/lib/plan';
import { isAllowedSalonImageUrl, deleteFromStorage, BUCKET_NAME } from '@/lib/storage';
import { DEMO_SALON, DEMO_PHOTOS, DEMO_OWNER_EMAIL } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    // Static Demo Settings
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        salon: DEMO_SALON,
        photos: DEMO_PHOTOS,
        user: {
          email: DEMO_OWNER_EMAIL,
          role: 'owner',
        },
      });
    }

    const salonId = auth.session.salonId;
    const res = await query(
      `SELECT id, name, slug, address, phone, brand_color, logo_url, custom_domain, custom_domain_verified,
              booking_enabled, open_time, close_time, slot_minutes, buffer_minutes,
              working_days, min_advance_hours, max_advance_days, send_reminders,
              cancel_policy_hours, invoice_prefix,
              upi_id, upi_number, upi_qr_url,
              trial_ends_at, subscription_status, subscription_ends_at, subscription_plan_id
       FROM salons
       WHERE id = $1
       LIMIT 1`,
      [salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const photosRes = await query(
      `SELECT id, url, storage_path, sort_order, created_at
       FROM salon_photos
       WHERE salon_id = $1::uuid
       ORDER BY sort_order ASC, created_at ASC`,
      [salonId]
    );

    return NextResponse.json(
      {
        salon: res.rows[0],
        photos: photosRes.rows,
        user: {
          email: auth.session.email,
          role: auth.session.role || 'owner',
        },
        plan: auth.session.plan || null,
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

    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const body = await request.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        salon: { ...DEMO_SALON, ...body },
        message: 'Settings updated successfully (Demo Mode).',
      });
    }

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
      invoice_prefix,
      upi_id,
      upi_number,
      upi_qr_url,
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
      const cleanLogo = String(logo_url).trim();
      if (cleanLogo.startsWith('data:')) {
        return NextResponse.json(
          { error: 'Base64 data URIs are not allowed. Please upload via the image uploader.' },
          { status: 400 }
        );
      }
      if (!isAllowedSalonImageUrl(cleanLogo, salonId)) {
        return NextResponse.json(
          { error: 'Logo URL must be an allowed URL or hosted in your salon storage folder.' },
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
    if (cancel_policy_hours !== undefined) {
      if (cancel_policy_hours === null || cancel_policy_hours === '') {
        return NextResponse.json(
          { error: 'Customers can cancel/reschedule up to 0 to 72 hours before.' },
          { status: 400 }
        );
      }
      const cancelHoursInt = typeof cancel_policy_hours === 'number'
        ? cancel_policy_hours
        : parseInt(String(cancel_policy_hours), 10);
      if (isNaN(cancelHoursInt) || !Number.isInteger(cancelHoursInt) || cancelHoursInt < 0 || cancelHoursInt > 72) {
        return NextResponse.json(
          { error: 'Customers can cancel/reschedule up to 0 to 72 hours before.' },
          { status: 400 }
        );
      }
      parsedCancelPolicyHours = cancelHoursInt;
    }

    let parsedInvoicePrefix: string | null = null;
    let hasInvoicePrefixUpdate = false;
    if (invoice_prefix !== undefined) {
      hasInvoicePrefixUpdate = true;
      if (invoice_prefix !== null && String(invoice_prefix).trim() !== '') {
        const cleanPrefix = String(invoice_prefix).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (cleanPrefix.length < 2 || cleanPrefix.length > 10) {
          return NextResponse.json(
            { error: 'Invoice prefix must be between 2 and 10 characters (letters, numbers, hyphens).' },
            { status: 400 }
          );
        }
        parsedInvoicePrefix = cleanPrefix;
      } else {
        parsedInvoicePrefix = null; // Reset to default/null so it falls back to salon name
      }
    }

    // Feature gating: logo_upload (only enforce if user is actively changing/uploading a new logo)
    if (logo_url !== undefined && logo_url) {
      const curSalon = await query('SELECT logo_url FROM salons WHERE id = $1', [salonId]);
      const currentLogo = curSalon.rows[0]?.logo_url;
      if (logo_url !== currentLogo) {
        const logoCheck = await requireFeature('logo_upload', salonId);
        if (!logoCheck.success) return logoCheck.error;

        // If replacing an existing Supabase Storage object, remove old storage file
        if (currentLogo && currentLogo.includes(`/storage/v1/object/public/${BUCKET_NAME}/salons/${salonId}/`)) {
          const oldPath = currentLogo.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
          if (oldPath) {
            await deleteFromStorage(oldPath);
          }
        }
      }
    }

    // Feature gating: custom_domain mapping
    let sanitizedCustomDomain: string | null = undefined as any;
    if (custom_domain !== undefined) {
      if (custom_domain && typeof custom_domain === 'string' && custom_domain.trim().length > 0) {
        const domainCheck = await requireFeature('custom_domain', salonId);
        if (!domainCheck.success) return domainCheck.error;

        const cleanDomain = custom_domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        
        // Uniqueness check across other salons
        const dupRes = await query(
          `SELECT id FROM salons WHERE custom_domain = $1 AND id != $2 LIMIT 1`,
          [cleanDomain, salonId]
        );
        if (dupRes.rows.length > 0) {
          return NextResponse.json(
            { error: 'This custom domain is already linked to another salon on the platform.' },
            { status: 409 }
          );
        }

        sanitizedCustomDomain = cleanDomain;
        // If domain is updated to a new domain, reset verification until verified by admin
        const currentRes = await query(`SELECT custom_domain FROM salons WHERE id = $1`, [salonId]);
        if (currentRes.rows[0]?.custom_domain !== cleanDomain) {
          await query(`UPDATE salons SET custom_domain_verified = false WHERE id = $1`, [salonId]);
        }
      } else {
        sanitizedCustomDomain = null;
        await query(`UPDATE salons SET custom_domain_verified = false WHERE id = $1`, [salonId]);
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
           custom_domain = CASE WHEN $15::boolean THEN $16::text ELSE custom_domain END,
           cancel_policy_hours = COALESCE($17::integer, cancel_policy_hours),
           invoice_prefix = CASE WHEN $18::boolean THEN $19::text ELSE invoice_prefix END,
           upi_id = CASE WHEN $20::boolean THEN $21::text ELSE upi_id END,
           upi_number = CASE WHEN $22::boolean THEN $23::text ELSE upi_number END,
           upi_qr_url = CASE WHEN $24::boolean THEN $25::text ELSE upi_qr_url END
       WHERE id = $26::uuid
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
        sanitizedCustomDomain !== undefined,
        sanitizedCustomDomain || null,
        parsedCancelPolicyHours,
        hasInvoicePrefixUpdate,
        parsedInvoicePrefix,
        upi_id !== undefined,
        upi_id ? String(upi_id).trim() : null,
        upi_number !== undefined,
        upi_number ? String(upi_number).trim() : null,
        upi_qr_url !== undefined,
        upi_qr_url ? String(upi_qr_url).trim() : null,
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
