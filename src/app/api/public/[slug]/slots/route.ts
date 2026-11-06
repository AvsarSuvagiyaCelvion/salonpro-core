import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/slots';
import { DEMO_SALON, DEMO_SERVICES, DEMO_STAFF } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const serviceId = searchParams.get('service_id');
    const staffId = searchParams.get('staff_id') || 'anyone';
    const date = searchParams.get('date');

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'service_id and date are required' },
        { status: 400 }
      );
    }

    // Static Demo Slots (Zero Database Dependency)
    if (slug.toLowerCase().trim() === 'dixa-beauty-salon') {
      const selectedService = DEMO_SERVICES.find((s) => s.id === serviceId) || DEMO_SERVICES[0];
      const eligibleStaff =
        staffId && staffId !== 'anyone'
          ? DEMO_STAFF.filter((s) => s.id === staffId)
          : DEMO_STAFF;
      const assignedStaff = eligibleStaff[0] || DEMO_STAFF[0];

      const demoSlotTimes = [
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '12:00',
        '12:30',
        '14:00',
        '14:30',
        '15:00',
        '15:30',
        '16:00',
        '16:30',
        '17:00',
        '17:30',
        '18:00',
        '18:30',
        '19:00',
        '19:30',
      ];

      const format12h = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
      };

      return NextResponse.json({
        salon: DEMO_SALON,
        service: selectedService,
        date,
        isClosedDay: false,
        slots: demoSlotTimes.map((timeStr) => ({
          time: timeStr,
          formattedTime: format12h(timeStr),
          staffId: assignedStaff.id,
          staffName: assignedStaff.name,
        })),
      });
    }

    const result = await getAvailableSlots({
      salonSlug: slug,
      serviceId,
      staffId,
      date,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return serverError(error, 'src/app/api/public/[slug]/slots/route.ts');
  }
}
