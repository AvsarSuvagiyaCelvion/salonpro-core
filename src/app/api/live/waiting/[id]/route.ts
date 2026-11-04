import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await params;

    const res = await query(
      'DELETE FROM waiting WHERE id = $1 AND salon_id = $2 RETURNING id',
      [id, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Waiting customer not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Removed from waiting queue' });
  } catch (error: any) {
    return serverError(error, 'src/app/api/live/waiting/[id]/route.ts');
  }
}
