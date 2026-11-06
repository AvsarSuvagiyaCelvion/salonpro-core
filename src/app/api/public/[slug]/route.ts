import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSalonPlan } from '@/lib/plan';
import { getSalonHolidays } from '@/lib/holidays';
import {
  DEMO_SALON,
  DEMO_SERVICES,
  DEMO_STAFF,
  DEMO_PHOTOS,
  DEMO_REVIEWS,
} from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Static Demo Showcase Handler (Zero Database Dependency)
    if (slug.toLowerCase().trim() === 'dixa-beauty-salon') {
      return NextResponse.json({
        salon: DEMO_SALON,
        services: DEMO_SERVICES,
        staff: DEMO_STAFF.map((s) => ({ id: s.id, name: s.name, role_title: s.role_title })),
        staffServices: [
          { staff_id: 'stf-1', service_id: 'srv-1' },
          { staff_id: 'stf-1', service_id: 'srv-5' },
          { staff_id: 'stf-2', service_id: 'srv-2' },
          { staff_id: 'stf-2', service_id: 'srv-6' },
          { staff_id: 'stf-3', service_id: 'srv-3' },
          { staff_id: 'stf-3', service_id: 'srv-4' },
        ],
        holidays: [],
        photos: DEMO_PHOTOS,
        reviewsSummary: {
          average: 4.9,
          count: 28,
          enabled: true,
        },
        reviews: DEMO_REVIEWS.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          owner_reply: r.owner_reply,
          owner_replied_at: r.owner_replied_at,
          created_at: r.created_at,
          service_name: r.service_name,
          customer_name:
            r.customer_name.split(' ')[0] +
            ' ' +
            (r.customer_name.split(' ')[1] ? r.customer_name.split(' ')[1][0] + '.' : ''),
        })),
      });
    }

    // Fetch salon
    const salonRes = await query(
      `SELECT id, name, slug, address, phone, brand_color, logo_url, open_time, close_time, 
              booking_enabled, working_days, slot_minutes, buffer_minutes, min_advance_hours, max_advance_days, is_active
       FROM salons 
       WHERE slug = $1 
       LIMIT 1`,
      [slug]
    );

    if (salonRes.rows.length === 0) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }

    const salon = salonRes.rows[0];

    if (!salon.is_active) {
      return NextResponse.json(
        { error: 'This salon workspace is currently suspended by administration.' },
        { status: 403 }
      );
    }

    // Check if salon has an active trial or paid subscription
    const planCheck = await getSalonPlan(salon.id);
    if (planCheck.error) {
      return NextResponse.json(
        { error: 'Online booking is temporarily inactive for this salon due to an expired subscription.' },
        { status: 402 }
      );
    }

    // Fetch services enabled for online booking
    const servicesRes = await query(
      `SELECT id, name, category, description, duration_min, price 
       FROM services 
       WHERE salon_id = $1 AND online_enabled = true 
       ORDER BY category ASC, name ASC`,
      [salon.id]
    );

    // Fetch staff that show online
    const staffRes = await query(
      `SELECT id, name, role_title 
       FROM staff 
       WHERE salon_id = $1 AND active = true AND show_online = true 
       ORDER BY name ASC`,
      [salon.id]
    );

    // Fetch staff service mappings
    const mappingRes = await query(
      `SELECT ss.staff_id, ss.service_id 
       FROM staff_services ss
       JOIN staff s ON ss.staff_id = s.id
       WHERE s.salon_id = $1`,
      [salon.id]
    );

    // Fetch upcoming holidays/closures
    const holidays = await getSalonHolidays(salon.id);

    // Fetch public gallery photos
    const photosRes = await query(
      `SELECT id, url, sort_order 
       FROM salon_photos 
       WHERE salon_id = $1::uuid 
       ORDER BY sort_order ASC, created_at ASC`,
      [salon.id]
    );

    // Fetch review ratings & latest 5 visible reviews (if plan allows reviews)
    const planAllowsReviews = planCheck.plan?.flags.reviews ?? false;
    let reviewsSummary = { average: 0, count: 0, enabled: false };
    let latestReviews: any[] = [];

    if (planAllowsReviews) {
      const summaryRes = await query(
        `SELECT
           COUNT(*)::int as count,
           COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float as average
         FROM reviews
         WHERE salon_id = $1::uuid AND status = 'visible'`,
        [salon.id]
      );

      const sRow = summaryRes.rows[0];
      const count = Number(sRow?.count) || 0;
      const average = Number(sRow?.average) || 0;

      reviewsSummary = {
        average,
        count,
        enabled: true,
      };

      if (count > 0) {
        const reviewsRes = await query(
          `SELECT
             r.id,
             r.rating,
             r.comment,
             r.owner_reply,
             r.owner_replied_at,
             r.created_at,
             c.name as customer_raw_name,
             srv.name as service_name
           FROM reviews r
           JOIN customers c ON r.customer_id = c.id
           JOIN appointments a ON r.appointment_id = a.id
           LEFT JOIN services srv ON a.service_id = srv.id
           WHERE r.salon_id = $1::uuid AND r.status = 'visible'
           ORDER BY r.created_at DESC
           LIMIT 5`,
          [salon.id]
        );

        latestReviews = reviewsRes.rows.map((r) => {
          // Privacy protection: Return only "First name + last initial", never phone or full name
          let displayName = 'Client';
          if (r.customer_raw_name) {
            const parts = r.customer_raw_name.trim().split(/\s+/);
            if (parts.length === 1) {
              displayName = parts[0];
            } else {
              displayName = `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
            }
          }

          return {
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            owner_reply: r.owner_reply,
            owner_replied_at: r.owner_replied_at,
            created_at: r.created_at,
            service_name: r.service_name,
            customer_name: displayName,
          };
        });
      }
    }

    return NextResponse.json({
      salon,
      services: servicesRes.rows,
      staff: staffRes.rows,
      staffServices: mappingRes.rows,
      holidays,
      photos: photosRes.rows,
      reviewsSummary,
      reviews: latestReviews,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/public/[slug]/route.ts');
  }
}
