import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, invalidateUserAuthCache } from '@/lib/api-auth';
import { clearSalonCache } from '@/lib/salon';
import { invalidateSalonPlanCache } from '@/lib/plan';

// 1. Get detailed single salon info for Super Admin
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const res = await query(
      `SELECT 
        s.*,
        u.email as owner_email,
        u.full_name as owner_name,
        u.phone as owner_phone,
        COUNT(DISTINCT st.id) as staff_count,
        COUNT(DISTINCT sv.id) as services_count,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(DISTINCT a.id) as appointments_count,
        COALESCE(SUM(i.total), 0)::numeric(10,2) as total_revenue
      FROM salons s
      LEFT JOIN LATERAL (
        SELECT email, full_name, phone FROM users WHERE salon_id = s.id AND role = 'owner' LIMIT 1
      ) u ON true
      LEFT JOIN staff st ON s.id = st.salon_id
      LEFT JOIN services sv ON s.id = sv.salon_id
      LEFT JOIN customers c ON s.id = c.salon_id
      LEFT JOIN appointments a ON s.id = a.salon_id
      LEFT JOIN invoices i ON s.id = i.salon_id
      WHERE s.id = $1
      GROUP BY s.id, u.email, u.full_name, u.phone`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    return NextResponse.json({ salon: res.rows[0] });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/salons/[id]/route.ts');
  }
}

// 2. Update salon status (Suspend / Activate, Change Plan, Set Custom Domain)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(Boolean(body.is_active));
    }

    if (body.subscription_status !== undefined) {
      const allowed = ['trial', 'active', 'expired', 'cancelled'];
      if (!allowed.includes(body.subscription_status)) {
        return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 });
      }
      updates.push(`subscription_status = $${idx++}`);
      values.push(body.subscription_status);
    }

    if (body.subscription_plan_id !== undefined) {
      updates.push(`subscription_plan_id = $${idx++}`);
      values.push(body.subscription_plan_id || null);

      if (body.subscription_plan_id) {
        // Look up plan slug to keep salons.plan in sync
        const planLookup = await query('SELECT slug FROM subscription_plans WHERE id = $1', [body.subscription_plan_id]);
        if (planLookup.rows.length > 0) {
          updates.push(`plan = $${idx++}`);
          values.push(planLookup.rows[0].slug);
        }
      }
    }

    if (body.subscription_ends_at !== undefined) {
      updates.push(`subscription_ends_at = $${idx++}`);
      values.push(body.subscription_ends_at ? new Date(body.subscription_ends_at) : null);
    }

    if (body.custom_domain_verified !== undefined) {
      updates.push(`custom_domain_verified = $${idx++}`);
      values.push(Boolean(body.custom_domain_verified));
    }

    if (body.extend_trial_days !== undefined) {
      const days = parseInt(body.extend_trial_days, 10);
      if (!isNaN(days) && days > 0) {
        updates.push(`trial_ends_at = GREATEST(COALESCE(trial_ends_at, NOW()), NOW()) + ($${idx++} * INTERVAL '1 day')`);
        values.push(days);
        // Also ensure status is trial or active
        updates.push(`subscription_status = 'trial'`);
      }
    } else if (body.trial_ends_at !== undefined) {
      updates.push(`trial_ends_at = $${idx++}`);
      values.push(body.trial_ends_at ? new Date(body.trial_ends_at) : null);
    }

    if (body.plan !== undefined) {
      updates.push(`plan = $${idx++}`);
      values.push(body.plan.toLowerCase().trim());
    }

    if (body.custom_domain !== undefined) {
      const domain = body.custom_domain ? body.custom_domain.trim().toLowerCase() : null;
      if (domain) {
        // Check uniqueness of custom domain
        const domainCheck = await query(
          'SELECT id FROM salons WHERE custom_domain = $1 AND id != $2 LIMIT 1',
          [domain, id]
        );
        if (domainCheck.rows.length > 0) {
          return NextResponse.json({ error: 'Custom domain already in use by another salon' }, { status: 400 });
        }
      }
      updates.push(`custom_domain = $${idx++}`);
      values.push(domain);
    }

    if (body.booking_enabled !== undefined) {
      updates.push(`booking_enabled = $${idx++}`);
      values.push(Boolean(body.booking_enabled));
    }

    if (body.name !== undefined && body.name.trim().length > 0) {
      updates.push(`name = $${idx++}`);
      values.push(body.name.trim());
    }

    if (body.brand_color !== undefined) {
      updates.push(`brand_color = $${idx++}`);
      values.push(body.brand_color.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE salons SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    clearSalonCache();
    invalidateSalonPlanCache(id);
    invalidateUserAuthCache();

    return NextResponse.json({
      success: true,
      salon: res.rows[0],
      message: 'Salon updated successfully by Super Admin',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/salons/[id]/route.ts');
  }
}

// 3. Delete salon workspace (Only Super Admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const res = await query('DELETE FROM salons WHERE id = $1 RETURNING id, name, slug', [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    clearSalonCache();
    invalidateSalonPlanCache(id);
    invalidateUserAuthCache();

    return NextResponse.json({
      success: true,
      salon: res.rows[0],
      message: `Salon workspace ${res.rows[0].name} deleted successfully`,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/salons/[id]/route.ts');
  }
}
