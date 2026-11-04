import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { requireFeature } from '@/lib/plan';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const featureCheck = await requireFeature('memberships', salonId);
    if (!featureCheck.success) return featureCheck.error;

    // 1. Fetch Membership Plans
    const memRes = await query(
      `SELECT * FROM membership_plans 
       WHERE salon_id = $1 
       ORDER BY price ASC`,
      [salonId]
    );

    // 2. Fetch Package Plans with their bundled items
    const pkgRes = await query(
      `SELECT pp.*,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', ppi.id,
                    'kind', ppi.kind,
                    'ref_id', ppi.ref_id,
                    'qty', ppi.qty,
                    'name', CASE 
                              WHEN ppi.kind = 'service' THEN sv.name 
                              ELSE pr.name 
                            END
                  )
                )
                FROM package_plan_items ppi
                LEFT JOIN services sv ON (ppi.kind = 'service' AND ppi.ref_id = sv.id)
                LEFT JOIN products pr ON (ppi.kind = 'product' AND ppi.ref_id = pr.id)
                WHERE ppi.package_id = pp.id
                ), '[]'::json
              ) as items
       FROM package_plans pp
       WHERE pp.salon_id = $1
       ORDER BY pp.price ASC`,
      [salonId]
    );

    // 3. Fetch Customer Subscriptions
    const subsRes = await query(
      `SELECT cp.id, cp.customer_id, cp.kind, cp.plan_id, cp.starts_on, cp.expires_on, cp.amount_paid,
              c.name as customer_name, c.mobile as customer_mobile,
              CASE 
                WHEN cp.kind = 'membership' THEN mp.name 
                ELSE pp.name 
              END as plan_name,
              mp.services_discount_pct,
              mp.products_discount_pct,
              (cp.expires_on >= CURRENT_DATE) as is_active
       FROM customer_plans cp
       JOIN customers c ON cp.customer_id = c.id
       LEFT JOIN membership_plans mp ON (cp.kind = 'membership' AND cp.plan_id = mp.id)
       LEFT JOIN package_plans pp ON (cp.kind = 'package' AND cp.plan_id = pp.id)
       WHERE c.salon_id = $1
       ORDER BY cp.expires_on DESC`,
      [salonId]
    );

    return NextResponse.json({
      membershipPlans: memRes.rows,
      packagePlans: pkgRes.rows,
      subscriptions: subsRes.rows,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/memberships/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const featureCheck = await requireFeature('memberships', salonId);
    if (!featureCheck.success) return featureCheck.error;

    const body = await request.json();
    const { plan_type } = body; // 'membership' | 'package'

    if (plan_type === 'membership') {
      const {
        name,
        services_discount_pct = 10,
        products_discount_pct = 5,
        price,
        validity_days = 365,
      } = body;

      if (!name || price === undefined) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
      }

      const res = await query(
        `INSERT INTO membership_plans (
          salon_id, name, services_discount_pct, products_discount_pct, price, validity_days, active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *`,
        [salonId, name.trim(), Number(services_discount_pct), Number(products_discount_pct), Number(price), parseInt(validity_days, 10)]
      );

      return NextResponse.json({
        plan: res.rows[0],
        message: 'Membership plan created',
      }, { status: 201 });
    } else if (plan_type === 'package') {
      const { name, price, validity_days = 90, items = [] } = body;

      if (!name || price === undefined) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
      }

      const res = await query(
        `INSERT INTO package_plans (salon_id, name, price, validity_days, active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING *`,
        [salonId, name.trim(), Number(price), parseInt(validity_days, 10)]
      );
      const pkg = res.rows[0];

      // Insert bundled items if any
      for (const it of items) {
        if (it.ref_id) {
          await query(
            `INSERT INTO package_plan_items (package_id, kind, ref_id, qty)
             VALUES ($1, $2, $3, $4)`,
            [pkg.id, it.kind || 'service', it.ref_id, parseInt(it.qty, 10) || 1]
          );
        }
      }

      return NextResponse.json({
        plan: pkg,
        message: 'Package plan created',
      }, { status: 201 });
    } else {
      return NextResponse.json({ error: 'Invalid plan_type' }, { status: 400 });
    }
  } catch (error: any) {
    return serverError(error, 'src/app/api/memberships/route.ts');
  }
}
