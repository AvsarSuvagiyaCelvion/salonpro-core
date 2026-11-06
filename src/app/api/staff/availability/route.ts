import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api-auth';
import { getStaffWorkingWindowsForDate } from '@/lib/availability';
import { DEMO_STAFF, DEMO_SALON } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const salonId = auth.session.salonId;

    // Demo salon simulation
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const targetDate = date || startDate || new Date().toISOString().slice(0, 10);
      const dayOfWeek = new Date(`${targetDate}T12:00:00Z`).getUTCDay();
      const isWorking = (DEMO_SALON.working_days || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);

      const demoMap: Record<string, any> = {};
      for (const st of DEMO_STAFF) {
        demoMap[st.id] = {
          isWorking,
          start: DEMO_SALON.open_time.slice(0, 5),
          end: DEMO_SALON.close_time.slice(0, 5),
          reason: isWorking ? 'working' : 'salon_closed_weekday',
        };
      }
      return NextResponse.json({ availability: demoMap });
    }

    // Single date lookup
    if (date) {
      const windowsMap = await getStaffWorkingWindowsForDate(salonId, date);
      const availabilityObj: Record<string, any> = {};
      windowsMap.forEach((val, key) => {
        availabilityObj[key] = val;
      });
      return NextResponse.json({ availability: availabilityObj });
    }

    // Range lookup (e.g. week view): iterate over dates
    if (startDate && endDate) {
      const start = new Date(`${startDate}T12:00:00Z`);
      const end = new Date(`${endDate}T12:00:00Z`);
      const rangeMap: Record<string, Record<string, any>> = {};

      const current = new Date(start);
      while (current <= end) {
        const dStr = current.toISOString().slice(0, 10);
        const dayWindows = await getStaffWorkingWindowsForDate(salonId, dStr);
        const dayObj: Record<string, any> = {};
        dayWindows.forEach((val, key) => {
          dayObj[key] = val;
        });
        rangeMap[dStr] = dayObj;
        current.setDate(current.getDate() + 1);
      }

      return NextResponse.json({ availability: rangeMap });
    }

    return NextResponse.json(
      { error: 'date or startDate and endDate query parameters are required' },
      { status: 400 }
    );
  } catch (error: any) {
    return serverError(error, 'src/app/api/staff/availability/route.ts');
  }
}

