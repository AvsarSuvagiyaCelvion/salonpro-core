import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { deleteSalonHoliday } from '@/lib/holidays';

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

    const deleted = await deleteSalonHoliday(salonId, id);
    if (!deleted) {
      return NextResponse.json({ error: 'Holiday not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Holiday removed. Operating slots on this date are now restored.',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/holidays/[id]/route.ts');
  }
}
