import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

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

    if (body.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(body.name.trim());
    }

    if (body.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(body.description?.trim() || null);
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
      }
      updates.push(`price = $${idx++}`);
      values.push(price);
    }

    if (body.yearly_price !== undefined) {
      const yearlyPrice = Number(body.yearly_price);
      if (isNaN(yearlyPrice) || yearlyPrice < 0) {
        return NextResponse.json({ error: 'Valid yearly price is required' }, { status: 400 });
      }
      updates.push(`yearly_price = $${idx++}`);
      values.push(yearlyPrice);
    }

    if (body.billing_interval !== undefined) {
      updates.push(`billing_interval = $${idx++}`);
      values.push(body.billing_interval === 'yearly' ? 'yearly' : 'monthly');
    }

    if (body.features !== undefined) {
      updates.push(`features = $${idx++}::jsonb`);
      values.push(JSON.stringify(Array.isArray(body.features) ? body.features : []));
    }

    if (body.limits !== undefined) {
      updates.push(`limits = $${idx++}::jsonb`);
      values.push(JSON.stringify(typeof body.limits === 'object' ? body.limits : {}));
    }

    if (body.flags !== undefined) {
      updates.push(`flags = $${idx++}::jsonb`);
      values.push(JSON.stringify(typeof body.flags === 'object' ? body.flags : {}));
    }

    if (body.max_staff !== undefined) {
      updates.push(`max_staff = $${idx++}`);
      values.push(Number(body.max_staff) || 0);
    }

    if (body.sort_order !== undefined) {
      updates.push(`sort_order = $${idx++}`);
      values.push(Number(body.sort_order) || 0);
    }

    if (body.is_popular !== undefined) {
      updates.push(`is_popular = $${idx++}`);
      values.push(Boolean(body.is_popular));
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(Boolean(body.is_active));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);

    values.push(id);
    const sql = `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan: res.rows[0],
      message: 'Plan updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Check if any salons are currently attached
    const check = await query('SELECT count(*) as count FROM salons WHERE subscription_plan_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      // Soft deactivate instead of hard delete
      await query('UPDATE subscription_plans SET is_active = false WHERE id = $1', [id]);
      return NextResponse.json({
        success: true,
        message: 'Plan deactivated because salons are currently assigned to it.',
      });
    }

    await query('DELETE FROM subscription_plans WHERE id = $1', [id]);
    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

