import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { getSalonHolidays, addSalonHoliday } from '@/lib/holidays';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const holidays = await getSalonHolidays(salonId);

    return NextResponse.json({ success: true, holidays });
  } catch (error: any) {
    return serverError(error, 'src/app/api/holidays/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const body = await request.json().catch(() => ({}));
    const { title, startDate, endDate, note } = body;

    const cleanTitle = (title || '').trim();
    const cleanStart = (startDate || '').trim();
    const cleanEnd = (endDate || cleanStart).trim();

    if (!cleanTitle) {
      return NextResponse.json({ error: 'Holiday title or closure reason is required.' }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(cleanStart) || !dateRegex.test(cleanEnd)) {
      return NextResponse.json({ error: 'Dates must be in valid YYYY-MM-DD format.' }, { status: 400 });
    }

    if (new Date(cleanEnd).getTime() < new Date(cleanStart).getTime()) {
      return NextResponse.json({ error: 'End date cannot be earlier than start date.' }, { status: 400 });
    }

    const holiday = await addSalonHoliday(salonId, {
      title: cleanTitle,
      startDate: cleanStart,
      endDate: cleanEnd,
      note: (note || '').trim() || null,
    });

    return NextResponse.json({
      success: true,
      holiday,
      message: `Holiday "${cleanTitle}" scheduled successfully. Booking slots on these dates will be blocked for customers.`,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/holidays/route.ts');
  }
}
