import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const { id } = await params;

    // Demo Mode Handler
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        success: true,
        message: 'Expense deleted (demo mode)',
      });
    }

    const delRes = await query(
      'DELETE FROM expenses WHERE id = $1 AND salon_id = $2 RETURNING id',
      [id, salonId]
    );

    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Expense record not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
      deletedId: id,
    });
  } catch (err: any) {
    return serverError(err, 'delete expense');
  }
}
