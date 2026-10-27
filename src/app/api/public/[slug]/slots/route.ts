import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/slots';

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

    const result = await getAvailableSlots({
      salonSlug: slug,
      serviceId,
      staffId,
      date,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
