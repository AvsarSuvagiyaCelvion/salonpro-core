import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id: sessionId, itemId } = await params;

    const res = await query(
      `DELETE FROM session_items 
       WHERE id = $1 AND session_id = $2 
         AND session_id IN (SELECT id FROM sessions WHERE salon_id = $3)
       RETURNING id`,
      [itemId, sessionId, salonId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found in this salon session' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Item removed from session' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
